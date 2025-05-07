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
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final InventoryItemRepository itemRepository;
    private final RestTemplate restTemplate;
    
    @Value("${supplier.api.url}")
    private String supplierApiUrl;
    
    @Transactional
    public Order createOrder(Long itemId, Integer quantity) {
        // Validate input
        if (quantity <= 0) {
            throw new IllegalArgumentException("Order quantity must be greater than 0");
        }
        
        // Get the item
        InventoryItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> InventoryException.itemNotFound(itemId));
            
        // Create order request for supplier
        var request = new SupplierOrderRequest(
            item.getName(),
            quantity,
            item.getDescription(),
            item.getUnitPrice()
        );
        
        // Call supplier API
        SupplierOrderResponse supplierResponse;
        try {
            String url = supplierApiUrl.trim() + "/api/orders";
            ResponseEntity<SupplierOrderResponse> response = restTemplate.postForEntity(
                url,
                request,
                SupplierOrderResponse.class
            );
            
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw InventoryException.supplierError("Supplier API returned unsuccessful response");
            }
            
            supplierResponse = response.getBody();
        } catch (RestClientException e) {
            throw InventoryException.supplierError("Failed to communicate with supplier API: " + e.getMessage());
        }
        
        // Create and save order
        Order order = new Order();
        order.setSupplierOrderId(supplierResponse.getOrderId());
        order.setItem(item);
        order.setQuantity(quantity);
        order.setStatus(supplierResponse.getStatus());
        order.setDeliveryDate(LocalDateTime.now());
        
        // Update inventory
        item.setQuantity(item.getQuantity() + quantity);
        itemRepository.save(item);
        
        Order savedOrder = orderRepository.save(order);
        
        // Log success
        System.out.printf("Successfully created order %s for %d units of item %s (ID: %d)%n",
            savedOrder.getId(), quantity, item.getName(), item.getId());
            
        return savedOrder;
    }
    
    // DTO classes for supplier API communication
    @lombok.Data
    private static class SupplierOrderRequest {
        private String name;
        private Integer quantity;
        private String description;
        private Double unitPrice;
        
        public SupplierOrderRequest(String name, Integer quantity, String description, Double unitPrice) {
            this.name = name;
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
} 