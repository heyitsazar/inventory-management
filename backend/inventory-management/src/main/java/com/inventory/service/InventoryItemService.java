package com.inventory.service;

import com.inventory.model.InventoryItem;
import com.inventory.repository.InventoryItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryItemService {

    private final InventoryItemRepository inventoryItemRepository;

    public List<InventoryItem> getAllItems() {
        List<InventoryItem> items = inventoryItemRepository.findAll();
        if (items.isEmpty()) {
            throw new EntityNotFoundException("No inventory items found");
        }
        return items;
    }

    public InventoryItem getItemById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                    String.format("Inventory item with ID %d not found", id)));
    }

    public InventoryItem getItemBySku(String sku) {
        return inventoryItemRepository.findBySku(sku)
                .orElseThrow(() -> new EntityNotFoundException(
                    String.format("Inventory item with SKU %s not found", sku)));
    }

    @Transactional
    public InventoryItem createItem(InventoryItem item) {
        if (inventoryItemRepository.existsBySku(item.getSku())) {
            throw new IllegalArgumentException(
                String.format("An item with SKU %s already exists", item.getSku()));
        }
        return inventoryItemRepository.save(item);
    }

    @Transactional
    public InventoryItem updateItem(Long id, InventoryItem updatedItem) {
        InventoryItem existingItem = getItemById(id);
        
        // Check if SKU is being changed and if the new SKU already exists
        if (!existingItem.getSku().equals(updatedItem.getSku()) && 
            inventoryItemRepository.existsBySku(updatedItem.getSku())) {
            throw new IllegalArgumentException(
                String.format("Cannot update SKU to %s as it already exists", updatedItem.getSku()));
        }
        
        // Update fields
        existingItem.setName(updatedItem.getName());
        existingItem.setSku(updatedItem.getSku());
        existingItem.setQuantity(updatedItem.getQuantity());
        existingItem.setMinStockLevel(updatedItem.getMinStockLevel());
        existingItem.setDescription(updatedItem.getDescription());
        existingItem.setUnitPrice(updatedItem.getUnitPrice());
        
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
} 