package com.inventory.repository;

import com.inventory.model.InventoryHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventoryHistoryRepository extends JpaRepository<InventoryHistory, Long> {
    
    List<InventoryHistory> findByItemIdOrderByChangeDateAsc(Long itemId);
    
    List<InventoryHistory> findByItemIdAndChangeDateBetweenOrderByChangeDateAsc(
        Long itemId, LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT h FROM InventoryHistory h WHERE h.item.id = ?1 AND h.changeDate >= ?2 ORDER BY h.changeDate ASC")
    List<InventoryHistory> findRecentHistory(Long itemId, LocalDateTime startDate);
} 