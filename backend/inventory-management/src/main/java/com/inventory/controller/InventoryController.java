package com.inventory.controller;

import com.inventory.model.InventoryItem;
import com.inventory.model.InventoryHistory;
import com.inventory.model.Purchase;
import com.inventory.service.InventoryItemService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;

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

    @PutMapping("/{id}/min-stock")
    public ResponseEntity<InventoryItem> updateMinStockLevel(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer minStockLevel = request.get("minStockLevel");
            if (minStockLevel == null) {
                return ResponseEntity.badRequest().build();
            }
            
            logger.info("Updating min stock level for item with ID: {}", id);
            InventoryItem item = inventoryService.getItemById(id);
            item.setMinStockLevel(minStockLevel);
            return ResponseEntity.ok(inventoryService.updateItem(id, item));
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to update min stock level for item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}/toggle-alert")
    public ResponseEntity<InventoryItem> toggleAlert(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {
        try {
            Boolean alertEnabled = request.get("alertEnabled");
            if (alertEnabled == null) {
                return ResponseEntity.badRequest().build();
            }
            
            logger.info("Toggling alert for item with ID: {} to {}", id, alertEnabled);
            InventoryItem item = inventoryService.getItemById(id);
            item.setAlertEnabled(alertEnabled);
            return ResponseEntity.ok(inventoryService.updateItem(id, item));
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to toggle alert for item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}/toggle-action")
    public ResponseEntity<InventoryItem> toggleAction(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> request) {
        try {
            Boolean actionEnabled = request.get("actionEnabled");
            if (actionEnabled == null) {
                return ResponseEntity.badRequest().build();
            }
            
            logger.info("Toggling automatic restock for item with ID: {} to {}", id, actionEnabled);
            InventoryItem item = inventoryService.getItemById(id);
            item.setActionEnabled(actionEnabled);
            return ResponseEntity.ok(inventoryService.updateItem(id, item));
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to toggle automatic restock for item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/purchases")
    public ResponseEntity<List<Purchase>> getPurchaseHistory(@PathVariable Long id) {
        try {
            logger.info("Fetching purchase history for item with ID: {}", id);
            List<Purchase> purchases = inventoryService.getPurchaseHistory(id);
            return ResponseEntity.ok(purchases);
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to fetch purchase history for item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/purchases/source/{source}")
    public ResponseEntity<List<Purchase>> getPurchaseHistoryBySource(@PathVariable String source) {
        try {
            logger.info("Fetching purchase history for source: {}", source);
            List<Purchase> purchases = inventoryService.getPurchaseHistoryBySource(source);
            return ResponseEntity.ok(purchases);
        } catch (Exception e) {
            logger.error("Failed to fetch purchase history for source {}: {}", source, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<List<InventoryHistory>> getItemHistory(@PathVariable Long id) {
        try {
            logger.info("Fetching inventory history for item with ID: {}", id);
            List<InventoryHistory> history = inventoryService.getItemHistory(id);
            return ResponseEntity.ok(history);
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to fetch inventory history for item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/history/range")
    public ResponseEntity<List<InventoryHistory>> getItemHistoryByDateRange(
            @PathVariable Long id,
            @RequestParam LocalDateTime startDate,
            @RequestParam LocalDateTime endDate) {
        try {
            logger.info("Fetching inventory history for item with ID: {} between {} and {}", 
                id, startDate, endDate);
            List<InventoryHistory> history = inventoryService.getItemHistoryByDateRange(id, startDate, endDate);
            return ResponseEntity.ok(history);
        } catch (EntityNotFoundException e) {
            logger.warn("Item not found with ID {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Failed to fetch inventory history for item with ID {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/near-minimum")
    public ResponseEntity<List<InventoryItem>> getItemsNearMinimumStock() {
        try {
            logger.info("Fetching items near minimum stock level");
            List<InventoryItem> items = inventoryService.getItemsNearMinimumStock();
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            logger.error("Failed to fetch items near minimum stock level: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
} 