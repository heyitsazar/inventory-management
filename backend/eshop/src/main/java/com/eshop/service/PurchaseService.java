package com.eshop.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class PurchaseService {
    private static final Logger logger = LoggerFactory.getLogger(PurchaseService.class);

    private final RestTemplate restTemplate;
    private final String inventoryServiceUrl;

    @Autowired
    public PurchaseService(
            RestTemplate restTemplate,
            @Value("${inventory.service.url}") String inventoryServiceUrl) {
        this.restTemplate = restTemplate;
        this.inventoryServiceUrl = inventoryServiceUrl;
    }

    public boolean purchaseItem(Long itemId) {
        try {
            logger.info("Attempting to purchase item with ID {}", itemId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            return restTemplate.postForObject(
                inventoryServiceUrl + "/api/inventory/" + itemId + "/purchase",
                null,
                Boolean.class
            );
        } catch (Exception e) {
            logger.error("Failed to purchase item with ID {}: {}", itemId, e.getMessage());
            throw new RuntimeException("Failed to purchase item", e);
        }
    }
} 