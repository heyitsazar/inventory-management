package com.inventory.controller;

import com.inventory.model.InventoryItem;
import com.inventory.service.InventoryItemService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private static final Logger logger = LoggerFactory.getLogger(InventoryController.class);

    private final InventoryItemService inventoryService;

    @Autowired
    public InventoryController(InventoryItemService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryItem>> getAllItems() {
        try {
            logger.info("Fetching all inventory items");
            List<InventoryItem> items = inventoryService.getAllItems();
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            logger.error("Failed to fetch inventory items: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItem> getItemById(@PathVariable Long id) {
        try {
            logger.info("Fetching inventory item with ID: {}", id);
            InventoryItem item = inventoryService.getItemById(id);
            return ResponseEntity.ok(item);
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to fetch inventory item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createItem(@RequestBody InventoryItem item) {
        try {
            logger.info("Creating new inventory item: {}", item.getName());
            InventoryItem createdItem = inventoryService.createItem(item);
            return ResponseEntity.ok(createdItem);
        } catch (Exception e) {
            logger.error("Failed to create inventory item: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> updateItem(
            @PathVariable Long id,
            @RequestBody InventoryItem updatedItem) {
        try {
            logger.info("Updating inventory item with ID: {}", id);
            InventoryItem item = inventoryService.updateItem(id, updatedItem);
            return ResponseEntity.ok(item);
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to update inventory item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        try {
            logger.info("Deleting inventory item with ID: {}", id);
            inventoryService.deleteItem(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to delete inventory item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<Boolean> purchaseItem(@PathVariable Long id) {
        try {
            logger.info("Processing purchase for item with ID: {}", id);
            boolean success = inventoryService.purchaseItem(id);
            return ResponseEntity.ok(success);
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to process purchase for item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 