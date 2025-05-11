package com.inventory.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "purchases")
public class Purchase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @Column(name = "total_price", nullable = false)
    private Double totalPrice;

    @Column(name = "source", nullable = false)
    private String source; // "ESHOP" or "MANUAL"

    @PrePersist
    protected void onCreate() {
        purchaseDate = LocalDateTime.now();
    }
} 