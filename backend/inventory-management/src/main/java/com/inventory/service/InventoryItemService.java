package com.inventory.service;

import com.inventory.model.*;
import com.inventory.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class InventoryItemService {
    private static final Logger logger = LoggerFactory.getLogger(InventoryItemService.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final PurchaseRepository purchaseRepository;
    private final InventoryHistoryRepository historyRepository;
    private final EmailService emailService;
    private final SupplierService supplierService;
    private final OrderRepository orderRepository;

    private void recordInventoryChange(InventoryItem item, Integer previousQuantity, 
                                     InventoryHistory.ChangeType changeType, 
                                     Long referenceId, String referenceType) {
        InventoryHistory history = new InventoryHistory();
        history.setItem(item);
        history.setPreviousQuantity(previousQuantity);
        history.setNewQuantity(item.getQuantity());
        history.setChangeType(changeType);
        history.setReferenceId(referenceId);
        history.setReferenceType(referenceType);
        historyRepository.save(history);
    }

    public List<InventoryItem> getAllItems() {
        logger.info("Fetching all inventory items");
        List<InventoryItem> items = inventoryItemRepository.findAll();
        return items; // Will return empty list if no items found
    }

    public InventoryItem getItemById(Long id) {
        logger.info("Fetching inventory item with ID: {}", id);
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Item not found with ID: " + id));
    }

    @Transactional
    public InventoryItem createItem(InventoryItem item) {
        InventoryItem savedItem = inventoryItemRepository.save(item);
        recordInventoryChange(savedItem, 0, InventoryHistory.ChangeType.INITIAL_STOCK, null, null);
        return savedItem;
    }

    @Transactional
    public InventoryItem updateItem(Long id, InventoryItem updatedItem) {
        InventoryItem existingItem = getItemById(id);
        Integer previousQuantity = existingItem.getQuantity();
        
        existingItem.setName(updatedItem.getName());
        existingItem.setQuantity(updatedItem.getQuantity());
        existingItem.setMinStockLevel(updatedItem.getMinStockLevel());
        existingItem.setDescription(updatedItem.getDescription());
        existingItem.setUnitPrice(updatedItem.getUnitPrice());
        existingItem.setAlertEnabled(updatedItem.getAlertEnabled());
        existingItem.setActionEnabled(updatedItem.getActionEnabled());
        
        InventoryItem savedItem = inventoryItemRepository.save(existingItem);
        
        if (!previousQuantity.equals(savedItem.getQuantity())) {
            recordInventoryChange(savedItem, previousQuantity, 
                InventoryHistory.ChangeType.MANUAL_UPDATE, null, null);
        }
        
        return savedItem;
    }

    @Transactional
    public void deleteItem(Long id) {
        if (!inventoryItemRepository.existsById(id)) {
            throw new EntityNotFoundException(
                String.format("Cannot delete: Inventory item with ID %d not found", id));
        }
        inventoryItemRepository.deleteById(id);
    }

    @Transactional
    public boolean purchaseItem(Long id, Integer quantity, String source) {
        InventoryItem item = getItemById(id);
        
        if (item.getQuantity() < quantity) {
            logger.warn("Cannot purchase item with ID {}: Not enough stock", id);
            return false;
        }
        
        Integer previousQuantity = item.getQuantity();
        item.setQuantity(item.getQuantity() - quantity);
        InventoryItem savedItem = inventoryItemRepository.save(item);
        
        // Record purchase
        Purchase purchase = new Purchase();
        purchase.setItem(savedItem);
        purchase.setQuantity(quantity);
        purchase.setTotalPrice(savedItem.getUnitPrice() * quantity);
        purchase.setSource(source);
        Purchase savedPurchase = purchaseRepository.save(purchase);
        
        // If it's an eShop purchase, create an order
        if ("ESHOP".equals(source)) {
            Order order = new Order();
            order.setItem(savedItem);
            order.setQuantity(quantity);
            order.setTotalPrice(savedItem.getUnitPrice() * quantity);
            order.setStatus("COMPLETED");
            orderRepository.save(order);
            logger.info("Created order for eShop purchase: {} units of {}", 
                quantity, savedItem.getName());
        }
        
        // Record inventory change
        recordInventoryChange(savedItem, previousQuantity, 
            InventoryHistory.ChangeType.PURCHASE, savedPurchase.getId(), "PURCHASE");
        
        // Check if stock is below minimum level
        if (savedItem.getQuantity() <= savedItem.getMinStockLevel()) {
            if (savedItem.getAlertEnabled()) {
                emailService.sendLowStockAlert(savedItem);
            }
            
            if (savedItem.getActionEnabled()) {
                int restockQuantity = savedItem.getMinStockLevel() * 2;
                boolean orderPlaced = supplierService.placeOrder(savedItem.getId(), restockQuantity);
                if (orderPlaced) {
                    previousQuantity = savedItem.getQuantity();
                    savedItem.setQuantity(savedItem.getQuantity() + restockQuantity);
                    savedItem = inventoryItemRepository.save(savedItem);
                    
                    recordInventoryChange(savedItem, previousQuantity, 
                        InventoryHistory.ChangeType.RESTOCK, null, "ORDER");
                    
                    emailService.sendRestockActionEmail(savedItem, restockQuantity);
                }
            }
        }
        
        logger.info("Successfully purchased {} units of item with ID {}", quantity, id);
        return true;
    }

    // For backward compatibility
    @Transactional
    public boolean purchaseItem(Long id) {
        return purchaseItem(id, 1, "MANUAL");
    }

    public List<Purchase> getPurchaseHistory(Long itemId) {
        return purchaseRepository.findByItemId(itemId);
    }

    public List<Purchase> getPurchaseHistoryBySource(String source) {
        return purchaseRepository.findBySource(source);
    }

    @Transactional
    public InventoryItem updateStock(Long id, Integer quantity) {
        InventoryItem item = inventoryItemRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Item not found with ID: " + id));
            
        item.setQuantity(quantity);
        InventoryItem savedItem = inventoryItemRepository.save(item);
        
        // Check if stock is below minimum level
        if (savedItem.getQuantity() <= savedItem.getMinStockLevel()) {
            // Send alert if enabled
            if (savedItem.getAlertEnabled()) {
                emailService.sendLowStockAlert(savedItem);
            }
            
            // Trigger automatic restock if enabled
            if (savedItem.getActionEnabled()) {
                int restockQuantity = savedItem.getMinStockLevel() * 2; // Order double the min level
                boolean orderPlaced = supplierService.placeOrder(savedItem.getId(), restockQuantity);
                if (orderPlaced) {
                    // Update inventory with new stock
                    savedItem.setQuantity(savedItem.getQuantity() + restockQuantity);
                    inventoryItemRepository.save(savedItem);
                    logger.info("Updated inventory quantity for item {} after restock. New quantity: {}", 
                        savedItem.getId(), savedItem.getQuantity());
                    
                    // Send restock confirmation email
                    emailService.sendRestockActionEmail(savedItem, restockQuantity);
                }
            }
        }
        
        return savedItem;
    }

    public List<InventoryHistory> getItemHistory(Long itemId) {
        return historyRepository.findByItemIdOrderByChangeDateAsc(itemId);
    }

    public List<InventoryHistory> getItemHistoryByDateRange(Long itemId, 
            LocalDateTime startDate, LocalDateTime endDate) {
        return historyRepository.findByItemIdAndChangeDateBetweenOrderByChangeDateAsc(
            itemId, startDate, endDate);
    }

    public List<InventoryItem> getItemsNearMinimumStock() {
        logger.info("Fetching items near minimum stock level");
        List<InventoryItem> items = inventoryItemRepository.findItemsNearMinimumStock();
        return items.stream().limit(10).toList();
    }
} 