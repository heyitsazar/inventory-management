package com.eshop.controller;

import com.eshop.service.PurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow all origins
public class PurchaseController {
    private static final Logger logger = LoggerFactory.getLogger(PurchaseController.class);

    private final PurchaseService purchaseService;

    @PostMapping("/{itemId}")
    public ResponseEntity<Void> createPurchase(@PathVariable Long itemId) {
        logger.info("Processing purchase for item ID {}", itemId);
        
        try {
            purchaseService.purchaseItem(itemId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Failed to process purchase: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}