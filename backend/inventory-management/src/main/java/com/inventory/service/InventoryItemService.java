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