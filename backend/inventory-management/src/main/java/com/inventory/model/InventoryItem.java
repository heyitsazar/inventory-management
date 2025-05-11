package com.inventory.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_items")
public class InventoryItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Name is required")
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity cannot be negative")
    @Column(nullable = false)
    private Integer quantity;
    
    @NotNull(message = "Minimum stock level is required")
    @Min(value = 0, message = "Minimum stock level cannot be negative")
    @Column(name = "min_stock_level", nullable = false)
    private Integer minStockLevel;
    
    @Min(value = 0, message = "Safety stock cannot be negative")
    @Column(name = "safety_stock")
    private Integer safetyStock;
    
    @Column(name = "alert_enabled", nullable = false)
    private Boolean alertEnabled = true;
    
    @Column(name = "action_enabled", nullable = false)
    private Boolean actionEnabled = true;
    
    @Column(name = "auto_calculation_enabled", nullable = false)
    private Boolean autoCalculationEnabled = false;
    
    @Column(name = "unit_price", nullable = false)
    private Double unitPrice;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
} 