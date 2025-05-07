package com.inventory.exception;

public class InventoryException extends RuntimeException {
    private final String code;

    public InventoryException(String message, String code) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static InventoryException itemNotFound(Long id) {
        return new InventoryException(
            String.format("Inventory item with ID %d not found", id),
            "ITEM_NOT_FOUND"
        );
    }

    public static InventoryException insufficientStock(String itemName, Integer requested, Integer available) {
        return new InventoryException(
            String.format("Insufficient stock for item '%s'. Requested: %d, Available: %d", 
                itemName, requested, available),
            "INSUFFICIENT_STOCK"
        );
    }

    public static InventoryException supplierError(String details) {
        return new InventoryException(
            String.format("Error communicating with supplier: %s", details),
            "SUPPLIER_ERROR"
        );
    }

    public static InventoryException duplicateSku(String sku) {
        return new InventoryException(
            String.format("An item with SKU %s already exists", sku),
            "DUPLICATE_SKU"
        );
    }
} 