package com.inventory.controller;

import com.inventory.model.ApiResponse;
import com.inventory.model.InventoryItem;
import com.inventory.service.InventoryItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryItemController {

    private final InventoryItemService inventoryItemService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<InventoryItem>>> getAllItems() {
        List<InventoryItem> items = inventoryItemService.getAllItems();
        return ResponseEntity.ok(new ApiResponse<>(
            String.format("Successfully retrieved %d inventory items", items.size()),
            items
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryItem>> getItemById(@PathVariable Long id) {
        InventoryItem item = inventoryItemService.getItemById(id);
        return ResponseEntity.ok(new ApiResponse<>(
            String.format("Successfully retrieved item with ID %d", id),
            item
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<InventoryItem>> createItem(@Valid @RequestBody InventoryItem item) {
        InventoryItem createdItem = inventoryItemService.createItem(item);
        return new ResponseEntity<>(new ApiResponse<>(
            String.format("Successfully created item '%s'", createdItem.getName()),
            createdItem
        ), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<InventoryItem>> updateItem(
            @PathVariable Long id, 
            @Valid @RequestBody InventoryItem item) {
        InventoryItem updatedItem = inventoryItemService.updateItem(id, item);
        return ResponseEntity.ok(new ApiResponse<>(
            String.format("Successfully updated item with ID %d", id),
            updatedItem
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable Long id) {
        inventoryItemService.deleteItem(id);
        return ResponseEntity.ok(new ApiResponse<>(
            String.format("Successfully deleted item with ID %d", id),
            null
        ));
    }
} 