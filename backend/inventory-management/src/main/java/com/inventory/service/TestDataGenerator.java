package com.inventory.service;

import com.inventory.model.InventoryItem;
import com.inventory.model.Order;
import com.inventory.repository.InventoryItemRepository;
import com.inventory.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.github.javafaker.Faker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class TestDataGenerator {
    private static final Logger logger = LoggerFactory.getLogger(TestDataGenerator.class);
    private final Faker faker = new Faker();
    private final Random random = new Random();
    
    private final InventoryItemService inventoryService;
    private final InventoryItemRepository itemRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public void generateTestData() {
        logger.info("Starting test data generation...");
        
        // Generate 5 random items
        List<InventoryItem> items = generateItems(5);
        
        // Simulate 7 days of activity
        simulateInventoryActivity(items, 7);
        
        logger.info("Test data generation completed!");
    }

    private List<InventoryItem> generateItems(int count) {
        List<InventoryItem> items = new ArrayList<>();
        
        // First create one item that will definitely be near minimum
        InventoryItem nearMinItem = new InventoryItem();
        nearMinItem.setName("Critical Stock Item");
        nearMinItem.setDescription("This item is always near minimum stock for testing");
        nearMinItem.setMinStockLevel(10);
        nearMinItem.setQuantity(12); // Within 20% of minimum
        nearMinItem.setUnitPrice(999.99);
        nearMinItem.setAlertEnabled(true);
        nearMinItem.setActionEnabled(true);
        
        items.add(inventoryService.createItem(nearMinItem));
        logger.info("Created critical stock item: {} with quantity {} and min stock {}", 
            nearMinItem.getName(), nearMinItem.getQuantity(), nearMinItem.getMinStockLevel());
        
        // Create remaining random items
        for (int i = 1; i < count; i++) {
            InventoryItem item = new InventoryItem();
            item.setName(faker.commerce().productName());
            item.setDescription(faker.lorem().sentence());
            
            // Set minimum stock level between 10-20
            int minStock = faker.number().numberBetween(10, 20);
            item.setMinStockLevel(minStock);
            
            // Set current quantity very close to minimum (within 20%)
            int quantity = faker.number().numberBetween(
                minStock, 
                (int)(minStock * 1.2)
            );
            item.setQuantity(quantity);
            
            item.setUnitPrice(Double.parseDouble(faker.commerce().price(100, 2000)));
            item.setAlertEnabled(true);
            item.setActionEnabled(true);
            
            items.add(inventoryService.createItem(item));
            logger.info("Created item: {} with quantity {} and min stock {}", 
                item.getName(), item.getQuantity(), item.getMinStockLevel());
        }
        
        return items;
    }

    private void simulateInventoryActivity(List<InventoryItem> items, int days) {
        for (int day = 0; day < days; day++) {
            // Simulate 2-3 purchases per day
            int purchasesPerDay = faker.number().numberBetween(2, 3);
            
            for (int i = 0; i < purchasesPerDay; i++) {
                // Randomly select an item
                InventoryItem item = items.get(random.nextInt(items.size()));
                
                // Purchase 2-4 units
                int quantity = faker.number().numberBetween(2, 4);
                
                // 70% chance of eShop purchase, 30% manual
                String source = random.nextDouble() < 0.7 ? "ESHOP" : "MANUAL";
                
                try {
                    boolean purchaseSuccess = inventoryService.purchaseItem(item.getId(), quantity, source);
                    
                    if (purchaseSuccess && "ESHOP".equals(source)) {
                        // Create an order for eShop purchases
                        Order order = new Order();
                        order.setItem(item);
                        order.setQuantity(quantity);
                        order.setTotalPrice(item.getUnitPrice() * quantity);
                        order.setStatus("COMPLETED");
                        orderRepository.save(order);
                        logger.info("Created order for eShop purchase: {} units of {}", 
                            quantity, item.getName());
                    }
                    
                    logger.info("Simulated purchase: {} units of {} from {}", 
                        quantity, item.getName(), source);
                } catch (Exception e) {
                    logger.error("Failed to simulate purchase: {}", e.getMessage());
                }
            }
        }
    }
} 