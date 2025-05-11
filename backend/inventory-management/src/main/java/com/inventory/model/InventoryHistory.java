package com.inventory.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "inventory_history")
public class InventoryHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem item;
    
    @Column(name = "previous_quantity", nullable = false)
    private Integer previousQuantity;
    
    @Column(name = "new_quantity", nullable = false)
    private Integer newQuantity;
    
    @Column(name = "change_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private ChangeType changeType;
    
    @Column(name = "change_date", nullable = false)
    private LocalDateTime changeDate;
    
    @Column(name = "reference_id")
    private Long referenceId; // ID of related purchase or order
    
    @Column(name = "reference_type")
    private String referenceType; // "PURCHASE" or "ORDER"
    
    @PrePersist
    protected void onCreate() {
        changeDate = LocalDateTime.now();
    }
    
    public enum ChangeType {
        PURCHASE,      // From eShop or manual
        RESTOCK,       // From supplier
        MANUAL_UPDATE, // Manual quantity adjustment
        INITIAL_STOCK  // Initial stock setup
    }
} 