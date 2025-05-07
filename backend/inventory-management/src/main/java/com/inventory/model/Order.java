package com.inventory.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String supplierOrderId;
    
    @ManyToOne
    @JoinColumn(name = "item_id")
    private InventoryItem item;
    
    private Integer quantity;
    private String status;
    private LocalDateTime orderDate;
    private LocalDateTime deliveryDate;
    
    @PrePersist
    protected void onCreate() {
        orderDate = LocalDateTime.now();
    }
} 