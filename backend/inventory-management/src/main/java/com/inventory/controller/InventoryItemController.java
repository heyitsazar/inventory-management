package com.inventory.controller;

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
    public ResponseEntity<List<InventoryItem>> getAllItems() {
        return ResponseEntity.ok(inventoryItemService.getAllItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InventoryItem> getItemById(@PathVariable Long id) {
        return ResponseEntity.ok(inventoryItemService.getItemById(id));
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<InventoryItem> getItemBySku(@PathVariable String sku) {
        return ResponseEntity.ok(inventoryItemService.getItemBySku(sku));
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createItem(@Valid @RequestBody InventoryItem item) {
        return new ResponseEntity<>(inventoryItemService.createItem(item), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<InventoryItem> updateItem(@PathVariable Long id, @Valid @RequestBody InventoryItem item) {
        return ResponseEntity.ok(inventoryItemService.updateItem(id, item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(@PathVariable Long id) {
        inventoryItemService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
} 