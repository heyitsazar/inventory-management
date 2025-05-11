package com.inventory.repository;

import com.inventory.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    List<Purchase> findByItemId(Long itemId);
    List<Purchase> findBySource(String source);
} 