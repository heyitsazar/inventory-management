package com.inventory.controller;

import com.inventory.model.ApiResponse;
import com.inventory.model.Purchase;
import com.inventory.service.PurchaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/purchases")
public class PurchaseController {

    @Autowired
    private PurchaseService purchaseService;

    @PostMapping
    public ResponseEntity<ApiResponse<Purchase>> createPurchase(@RequestBody Purchase purchase) {
        Purchase processedPurchase = purchaseService.processPurchase(purchase);
        return ResponseEntity.ok(new ApiResponse<>(
            String.format("Successfully processed purchase for item ID %d", purchase.getItem().getId()),
            processedPurchase
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<Purchase>>> getAllPurchases() {
        return ResponseEntity.ok(new ApiResponse<>(
            "Successfully retrieved all purchases",
            purchaseService.getAllPurchases()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Purchase>> getPurchaseById(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(
            String.format("Successfully retrieved purchase with ID %d", id),
            purchaseService.getPurchaseById(id)
        ));
    }
} 