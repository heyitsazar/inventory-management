package com.inventory.controller;

import com.inventory.service.TestDataGenerator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/test")
@CrossOrigin(origins = "*") // Allow all origins
public class TestDataController {
    private static final Logger logger = LoggerFactory.getLogger(TestDataController.class);
    
    private final TestDataGenerator testDataGenerator;
    
    public TestDataController(TestDataGenerator testDataGenerator) {
        this.testDataGenerator = testDataGenerator;
    }
    
    @PostMapping("/generate")
    public ResponseEntity<String> generateTestData() {
        try {
            logger.info("Starting test data generation...");
            testDataGenerator.generateTestData();
            return ResponseEntity.ok("Test data generated successfully!");
        } catch (Exception e) {
            logger.error("Failed to generate test data: {}", e.getMessage());
            return ResponseEntity.internalServerError().body("Failed to generate test data: " + e.getMessage());
        }
    }
} 