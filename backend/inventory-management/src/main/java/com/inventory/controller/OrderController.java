package com.inventory.controller;

import com.inventory.model.Order;
import com.inventory.model.InventoryItem;
import com.inventory.service.OrderService;
import com.inventory.repository.InventoryItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*") // Allow all origins
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;
    private final InventoryItemRepository inventoryItemRepository;

    @Autowired
    public OrderController(OrderService orderService, InventoryItemRepository inventoryItemRepository) {
        this.orderService = orderService;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @PostMapping("/{itemId}")
    public ResponseEntity<Order> createOrder(
            @PathVariable Long itemId,
            @RequestBody OrderRequest request) {
        try {
            logger.info("Creating order for item ID: {} with quantity: {}", itemId, request.getQuantity());
            
            // Get the item
            InventoryItem item = inventoryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Item not found with ID: " + itemId));
            
            // Create order object
            Order order = new Order();
            order.setItem(item);
            order.setQuantity(request.getQuantity());
            order.setTotalPrice(item.getUnitPrice() * request.getQuantity());
            order.setStatus("COMPLETED");
            
            // Process the order
            Order savedOrder = orderService.processOrder(order);
            
            logger.info("Successfully created order with ID: {} and total price: {}", 
                savedOrder.getId(), 
                savedOrder.getTotalPrice());
            return ResponseEntity.ok(savedOrder);
        } catch (Exception e) {
            logger.error("Failed to create order: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        try {
            logger.info("Fetching all orders");
            List<Order> orders = orderService.getAllOrders();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            logger.error("Failed to fetch orders: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrderById(@PathVariable Long id) {
        try {
            logger.info("Fetching order with ID {}", id);
            Order order = orderService.getOrderById(id);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            logger.error("Failed to fetch order with ID {}: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @lombok.Data
    private static class OrderRequest {
        private Integer quantity;
    }
} 