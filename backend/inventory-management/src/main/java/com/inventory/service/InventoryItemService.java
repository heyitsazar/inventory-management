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
        // Validate required fields
        if (item.getMinStockLevel() == null) {
            throw new IllegalArgumentException("Minimum stock level is required");
        }
        
        // Calculate safety stock if auto-calculation is enabled
        if (item.getAutoCalculationEnabled()) {
            item.setSafetyStock(item.getMinStockLevel() + (int)(item.getMinStockLevel() * 0.2));
        }
        
        InventoryItem savedItem = inventoryItemRepository.save(item);
        recordInventoryChange(savedItem, 0, InventoryHistory.ChangeType.INITIAL_STOCK, null, null);
        return savedItem;
    }

    @Transactional
    public InventoryItem updateItem(Long id, InventoryItem item) {
        InventoryItem existingItem = getItemById(id);
        
        // Only validate minStockLevel if it's being changed
        if (item.getMinStockLevel() != null) {
            // Calculate safety stock if auto-calculation is enabled
            if (item.getAutoCalculationEnabled()) {
                item.setSafetyStock(item.getMinStockLevel() + (int)(item.getMinStockLevel() * 0.2));
            }
        }
        
        // Update fields if they are provided
        if (item.getName() != null) existingItem.setName(item.getName());
        if (item.getDescription() != null) existingItem.setDescription(item.getDescription());
        if (item.getQuantity() != null) existingItem.setQuantity(item.getQuantity());
        if (item.getUnitPrice() != null) existingItem.setUnitPrice(item.getUnitPrice());
        if (item.getMinStockLevel() != null) existingItem.setMinStockLevel(item.getMinStockLevel());
        if (item.getSafetyStock() != null) existingItem.setSafetyStock(item.getSafetyStock());
        if (item.getAlertEnabled() != null) existingItem.setAlertEnabled(item.getAlertEnabled());
        if (item.getActionEnabled() != null) existingItem.setActionEnabled(item.getActionEnabled());
        if (item.getAutoCalculationEnabled() != null) existingItem.setAutoCalculationEnabled(item.getAutoCalculationEnabled());
        
        InventoryItem savedItem = inventoryItemRepository.save(existingItem);
        
        if (item.getQuantity() != null && !item.getQuantity().equals(savedItem.getQuantity())) {
            recordInventoryChange(savedItem, item.getQuantity(), 
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
        
        // Check stock levels and send appropriate alerts
        if (savedItem.getAlertEnabled()) {
            if (savedItem.getQuantity() <= savedItem.getMinStockLevel()) {
                // Urgent alert - stock at or below minimum
                emailService.sendLowStockAlert(savedItem);
                logger.warn("URGENT: Stock for item {} is at or below minimum level", savedItem.getName());
            } else if (savedItem.getSafetyStock() != null && savedItem.getQuantity() <= savedItem.getSafetyStock()) {
                // Normal alert - stock below safety level
                emailService.sendLowStockAlert(savedItem);
                logger.info("ALERT: Stock for item {} is below safety level", savedItem.getName());
            }
        }
        
        // Check if we need to place an order
        if (savedItem.getActionEnabled()) {
            boolean shouldOrder = false;
            int restockQuantity = 0;
            
            if (savedItem.getSafetyStock() != null) {
                // If safety stock is set, use it as trigger
                if (savedItem.getQuantity() <= savedItem.getSafetyStock()) {
                    shouldOrder = true;
                    restockQuantity = savedItem.getSafetyStock() + (int)(savedItem.getSafetyStock() * 0.2);
                }
            } else {
                // If no safety stock, use min stock level as trigger
                if (savedItem.getQuantity() <= savedItem.getMinStockLevel()) {
                    shouldOrder = true;
                    restockQuantity = savedItem.getMinStockLevel() + (int)(savedItem.getMinStockLevel() * 0.2);
                }
            }
            
            if (shouldOrder) {
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
        
        // Record inventory change
        recordInventoryChange(savedItem, previousQuantity, 
            InventoryHistory.ChangeType.PURCHASE, savedPurchase.getId(), "PURCHASE");
        
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
            
        // Validate minStockLevel exists
        if (item.getMinStockLevel() == null) {
            throw new IllegalStateException("Cannot update stock: Minimum stock level is not set for item " + id);
        }
            
        item.setQuantity(quantity);
        InventoryItem savedItem = inventoryItemRepository.save(item);
        
        // Check stock levels and send appropriate alerts
        if (savedItem.getAlertEnabled()) {
            if (savedItem.getQuantity() <= savedItem.getMinStockLevel()) {
                // Urgent alert - stock at or below minimum
                emailService.sendLowStockAlert(savedItem);
                logger.warn("URGENT: Stock for item {} is at or below minimum level", savedItem.getName());
            } else if (savedItem.getSafetyStock() != null && savedItem.getQuantity() <= savedItem.getSafetyStock()) {
                // Normal alert - stock below safety level
                emailService.sendLowStockAlert(savedItem);
                logger.info("ALERT: Stock for item {} is below safety level", savedItem.getName());
            }
        }
        
        // Check if we need to place an order
        if (savedItem.getActionEnabled()) {
            boolean shouldOrder = false;
            int restockQuantity = 0;
            
            if (savedItem.getSafetyStock() != null) {
                // If safety stock is set, use it as trigger
                if (savedItem.getQuantity() <= savedItem.getSafetyStock()) {
                    shouldOrder = true;
                    restockQuantity = savedItem.getSafetyStock() + (int)(savedItem.getSafetyStock() * 0.2);
                }
            } else {
                // If no safety stock, use min stock level as trigger
                if (savedItem.getQuantity() <= savedItem.getMinStockLevel()) {
                    shouldOrder = true;
                    restockQuantity = savedItem.getMinStockLevel() + (int)(savedItem.getMinStockLevel() * 0.2);
                }
            }
            
            if (shouldOrder) {
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