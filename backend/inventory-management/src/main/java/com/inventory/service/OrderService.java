package com.inventory.service;

import com.inventory.exception.InventoryException;
import com.inventory.model.InventoryItem;
import com.inventory.model.Order;
import com.inventory.repository.InventoryItemRepository;
import com.inventory.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.persistence.EntityNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    
    private final OrderRepository orderRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final RestTemplate restTemplate;
    
    @Value("${supplier.api.url}")
    private String supplierApiUrl;
    
    public OrderService(OrderRepository orderRepository, InventoryItemRepository inventoryItemRepository, RestTemplate restTemplate) {
        this.orderRepository = orderRepository;
        this.inventoryItemRepository = inventoryItemRepository;
        this.restTemplate = restTemplate;
    }
    
    @Transactional
    public Order processOrder(Order order) {
        logger.info("Processing order for item: {}", order.getItem().getName());
        
        // For supplier orders, increase the quantity
        InventoryItem item = order.getItem();
        if (item == null) {
            throw new EntityNotFoundException("Item not found");
        }
        
        item.setQuantity(item.getQuantity() + order.getQuantity());
        inventoryItemRepository.save(item);
        
        return orderRepository.save(order);
    }
    
    // DTO classes for supplier API communication
    @lombok.Data
    private static class SupplierOrderRequest {
        private Long itemId;
        private Integer quantity;
        private String description;
        private Double unitPrice;
        
        public SupplierOrderRequest(Long itemId, Integer quantity, String description, Double unitPrice) {
            this.itemId = itemId;
            this.quantity = quantity;
            this.description = description;
            this.unitPrice = unitPrice;
        }
    }
    
    @lombok.Data
    private static class SupplierOrderResponse {
        private String orderId;
        private String status;
        private String message;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Order getOrderById(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found with ID: " + id));
    }
} 