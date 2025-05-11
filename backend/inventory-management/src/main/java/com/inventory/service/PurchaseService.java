package com.inventory.service;

import com.inventory.model.Purchase;
import com.inventory.model.InventoryItem;
import com.inventory.repository.PurchaseRepository;
import com.inventory.repository.InventoryItemRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PurchaseService {
    private static final Logger logger = LoggerFactory.getLogger(PurchaseService.class);

    private final PurchaseRepository purchaseRepository;
    private final InventoryItemRepository inventoryItemRepository;

    @Autowired
    public PurchaseService(PurchaseRepository purchaseRepository, InventoryItemRepository inventoryItemRepository) {
        this.purchaseRepository = purchaseRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @Transactional
    public Purchase processPurchase(Purchase purchase) {
        logger.info("Processing purchase for item: {}", purchase.getItem().getName());
        
        // For supplier orders, increase the quantity
        InventoryItem item = purchase.getItem();
        if (item == null) {
            throw new EntityNotFoundException("Item not found");
        }
        
        item.setQuantity(item.getQuantity() + purchase.getQuantity());
        inventoryItemRepository.save(item);
        
        return purchaseRepository.save(purchase);
    }

    public List<Purchase> getAllPurchases() {
        return purchaseRepository.findAll();
    }

    public Purchase getPurchaseById(Long id) {
        return purchaseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Purchase not found with ID: " + id));
    }
} 