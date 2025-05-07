package com.inventory.controller;

import com.inventory.model.ApiResponse;
import com.inventory.model.Order;
import com.inventory.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;
    
    @PostMapping("/{itemId}")
    public ResponseEntity<ApiResponse<Order>> createOrder(
            @PathVariable Long itemId,
            @RequestParam Integer quantity) {
        try {
            Order order = orderService.createOrder(itemId, quantity);
            return ResponseEntity.ok(new ApiResponse<>(
                String.format("Successfully created order for %d units of item ID %d", 
                    quantity, itemId),
                order
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(
                "Invalid order request: " + e.getMessage(),
                null
            ));
        }
    }
} 