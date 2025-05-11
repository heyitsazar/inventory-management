package com.inventory.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupplierService {
    private static final Logger logger = LoggerFactory.getLogger(SupplierService.class);
    
    private final RestTemplate restTemplate;
    
    @Value("${supplier.api.url}")
    private String supplierApiUrl;
    
    @Value("${supplier.api.key}")
    private String supplierApiKey;
    
    public boolean placeOrder(Long itemId, Integer quantity) {
        try {
            String url = supplierApiUrl + "/api/orders";
            
            // Create headers with API key
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-API-Key", supplierApiKey);
            
            // Create request body
            Map<String, Object> requestBody = Map.of(
                "itemId", itemId,
                "quantity", quantity
            );
            
            // Create HTTP entity with headers and body
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            logger.info("Order placed successfully for item {} with quantity {}", itemId, quantity);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            logger.error("Failed to place order: {}", e.getMessage());
            return false;
        }
    }
} 