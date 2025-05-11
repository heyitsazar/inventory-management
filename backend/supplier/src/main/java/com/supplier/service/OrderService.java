package com.supplier.service;

import com.supplier.model.OrderRequest;
import com.supplier.model.OrderResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OrderService {
    private static final Logger logger = LoggerFactory.getLogger(OrderService.class);
    
    private final RestTemplate restTemplate;
    
    @Value("${inventory.api.url}")
    private String inventoryApiUrl;

    @Value("${inventory.api.key}")
    private String inventoryApiKey;
    
    public OrderResponse processOrder(OrderRequest request, String apiKey) {
        // Debug logging
        logger.debug("Received API key: '{}'", apiKey);
        logger.debug("Expected API key: '{}'", inventoryApiKey);
        logger.debug("Are they equal? {}", apiKey != null && apiKey.equals(inventoryApiKey));
        
        // Verify the request is from inventory management
        if (apiKey == null || !apiKey.equals(inventoryApiKey)) {
            logger.error("Unauthorized access attempt");
            throw new RuntimeException("Unauthorized access");
        }

        try {
            // Update inventory in inventory management system
            String url = inventoryApiUrl.trim() + "/api/orders/" + request.getItemId();
            restTemplate.postForEntity(url, Map.of("quantity", request.getQuantity()), Void.class);
            
            logger.info("Order completed successfully for item ID {} with quantity {}", 
                request.getItemId(), 
                request.getQuantity());
                
            return new OrderResponse(true, "Order accepted");
            
        } catch (Exception e) {
            logger.error("Failed to process order: {}", e.getMessage());
            throw new RuntimeException("Unable to process order at this time. Please try again later.");
        }
    }
} 