package com.inventory.repository;

import com.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByName(String name);
    
    @Query(value = "SELECT i FROM InventoryItem i WHERE i.quantity <= i.minStockLevel * 1.2 ORDER BY CAST(i.quantity AS double) / i.minStockLevel ASC")
    List<InventoryItem> findItemsNearMinimumStock();
} 