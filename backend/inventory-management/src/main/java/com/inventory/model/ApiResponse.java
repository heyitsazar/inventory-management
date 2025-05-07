package com.inventory.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private String message;
    private T data;
    private String requestId;
    
    public ApiResponse(String message, T data) {
        this.message = message;
        this.data = data;
        this.requestId = java.util.UUID.randomUUID().toString();
    }
} 