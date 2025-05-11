package com.inventory.service;

import com.inventory.model.InventoryItem;
import com.inventory.repository.InventoryItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryItemService {
    private static final Logger logger = LoggerFactory.getLogger(InventoryItemService.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final EmailService emailService;
    private final SupplierService supplierService;

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
        return inventoryItemRepository.save(item);
    }

    @Transactional
    public InventoryItem updateItem(Long id, InventoryItem updatedItem) {
        InventoryItem existingItem = getItemById(id);
        
        // Update fields
        existingItem.setName(updatedItem.getName());
        existingItem.setQuantity(updatedItem.getQuantity());
        existingItem.setMinStockLevel(updatedItem.getMinStockLevel());
        existingItem.setDescription(updatedItem.getDescription());
        existingItem.setUnitPrice(updatedItem.getUnitPrice());
        existingItem.setAlertEnabled(updatedItem.getAlertEnabled());
        existingItem.setActionEnabled(updatedItem.getActionEnabled());
        
        return inventoryItemRepository.save(existingItem);
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
    public boolean purchaseItem(Long id) {
        InventoryItem item = getItemById(id);
        
        if (item.getQuantity() <= 0) {
            logger.warn("Cannot purchase item with ID {}: Not enough stock", id);
            return false;
        }
        
        item.setQuantity(item.getQuantity() - 1);
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
        
        logger.info("Successfully purchased item with ID {}", id);
        return true;
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
} 