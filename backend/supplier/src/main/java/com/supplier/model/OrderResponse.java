package com.supplier.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private String orderId;
    private String status;
    private String message;
    private OrderRequest orderDetails;
    private LocalDateTime processedAt;
    private String requestId;

    public OrderResponse(String orderId, String status, String message, OrderRequest orderDetails) {
        this.orderId = orderId;
        this.status = status;
        this.message = message;
        this.orderDetails = orderDetails;
        this.processedAt = LocalDateTime.now();
        this.requestId = java.util.UUID.randomUUID().toString();
    }
} 