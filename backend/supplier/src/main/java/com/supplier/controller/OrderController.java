package com.supplier.controller;

import com.supplier.model.OrderRequest;
import com.supplier.model.OrderResponse;
import com.supplier.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    
    private final OrderService orderService;
    
    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @RequestBody OrderRequest request,
            @RequestHeader("X-API-Key") String apiKey) {
        logger.info("Processing order for item ID {} with quantity {}", request.getItemId(), request.getQuantity());
        
        try {
            OrderResponse response = orderService.processOrder(request, apiKey);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to process order: {}", e.getMessage());
            return ResponseEntity.ok(new OrderResponse(false, "Failed to process order"));
        }
    }
} 