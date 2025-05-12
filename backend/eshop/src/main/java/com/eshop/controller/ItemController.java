package com.eshop.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Allow all origins
public class ItemController {
    private static final Logger logger = LoggerFactory.getLogger(ItemController.class);
    
    private final RestTemplate restTemplate;
    
    @Value("${inventory.api.url}")
    private String inventoryApiUrl;
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllItems() {
        try {
            logger.info("Fetching all items from inventory management");
            String url = inventoryApiUrl.trim() + "/api/inventory";
            return ResponseEntity.ok(restTemplate.getForObject(url, List.class));
        } catch (Exception e) {
            logger.error("Failed to fetch items: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}