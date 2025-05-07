package com.supplier.model;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderRequest {
    @NotBlank(message = "Item name is required")
    private String name;
    
    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be greater than 0")
    private Integer quantity;
    
    private String description;
    
    @NotNull(message = "Unit price is required")
    @Min(value = 0, message = "Unit price cannot be negative")
    private Double unitPrice;
} 