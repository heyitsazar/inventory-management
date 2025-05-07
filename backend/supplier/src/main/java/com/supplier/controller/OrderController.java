package com.supplier.controller;

import com.supplier.model.OrderRequest;
import com.supplier.model.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.UUID;
import java.util.Map;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody OrderRequest request) {
        // Input validation
        if (request.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body(new OrderResponse(
                null,
                "REJECTED",
                String.format("Order rejected: Quantity %d is invalid. Must be greater than 0.", 
                    request.getQuantity()),
                request
            ));
        }

        // Generate a unique order ID
        String orderId = UUID.randomUUID().toString();
        
        try {
            // Log the order details
            logger.info("Processing order: orderId={}, item={}, quantity={}, unitPrice={}", 
                orderId, request.getName(), request.getQuantity(), request.getUnitPrice());
            
            // Create response with detailed message
            OrderResponse response = new OrderResponse(
                orderId,
                "COMPLETED",
                String.format("Order %s has been processed successfully. %d units of '%s' will be delivered at $%.2f per unit.", 
                    orderId, 
                    request.getQuantity(), 
                    request.getName(),
                    request.getUnitPrice()),
                request
            );
            
            logger.info("Order completed successfully: orderId={}, totalValue=${}", 
                orderId, 
                request.getQuantity() * request.getUnitPrice());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error processing order: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(new OrderResponse(
                null,
                "ERROR",
                String.format("Failed to process order: %s. Please try again or contact support if the problem persists.", 
                    e.getMessage()),
                request
            ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "message", "Supplier service is running",
            "timestamp", LocalDateTime.now().toString()
        ));
    }
} 