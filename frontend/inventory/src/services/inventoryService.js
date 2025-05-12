// inventoryService.js
import { apiRequest, BASE_URLS } from "../api";

const SUPPLIER_API_KEY = "supplier-secret-key-123";

const inventoryService = {
  // Item CRUD
  async getAllItems() {
    // No payload: Retrieves all items from the inventory
    // if 200 example [
    //     {
    //         "id": 1,
    //         "name": "Critical Stock Item",
    //         "description": "This item is always near minimum stock for testing",
    //         "quantity": 11,
    //         "minStockLevel": 10,
    //         "safetyStock": null,
    //         "alertEnabled": true,
    //         "actionEnabled": true,
    //         "autoCalculationEnabled": false,
    //         "unitPrice": 999.99,
    //         "createdAt": "2025-05-12T02:57:45.971117",
    //         "updatedAt": "2025-05-12T05:32:14.443736"
    //     },
    //     {
    //         "id": 2,
    //         "name": "Intelligent Rubber Bag",
    //         "description": "Est quia quo ducimus asperiores tenetur omnis.",
    //         "quantity": 26,
    //         "minStockLevel": 14,
    //         "safetyStock": null,
    //         "alertEnabled": true,
    //         "actionEnabled": true,
    //         "autoCalculationEnabled": false,
    //         "unitPrice": 1716.55,
    //         "createdAt": "2025-05-12T02:57:46.039995",
    //         "updatedAt": "2025-05-12T05:31:32.247477"
    //     },
    // ]
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: "/api/inventory",
    });
  },

  async getItemById(id) {
    // No payload: Retrieves a single item by its ID
    // example receive {
    //     "id": 1,
    //     "name": "Critical Stock Item",
    //     "description": "This item is always near minimum stock for testing",
    //     "quantity": 18,
    //     "minStockLevel": 10,
    //     "safetyStock": null,
    //     "alertEnabled": true,
    //     "actionEnabled": true,
    //     "autoCalculationEnabled": false,
    //     "unitPrice": 999.99,
    //     "createdAt": "2025-05-12T02:57:45.971117",
    //     "updatedAt": "2025-05-12T06:17:38.207317"
    // }
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: `/api/inventory/${id}`,
    });
  },

  async createItem(item) {
    // Payload: Object with item details
    // Example: {
    //   "name": "Test Product",           // Item name (string)
    //   "description": "A test product",  // Item description (string)
    //   "quantity": 150,                  // Current stock quantity (number)
    //   "unitPrice": 29.99,               // Price per unit (number)
    //   "minStockLevel": 100,             // Minimum stock threshold (number)
    //   "alertEnabled": true,             // Enable stock alerts (boolean)
    //   "actionEnabled": true             // Enable auto-actions (boolean)
    // }
    // example response if 200 {
    //     "id": 15,
    //     "name": "Tes4515",
    //     "description": "A test product for email alerts",
    //     "quantity": 150,
    //     "minStockLevel": 100,
    //     "safetyStock": null,
    //     "alertEnabled": true,
    //     "actionEnabled": true,
    //     "autoCalculationEnabled": false,
    //     "unitPrice": 29.99,
    //     "createdAt": "2025-05-12T05:43:05.2444878",
    //     "updatedAt": "2025-05-12T05:43:05.2444878"
    // }
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: "/api/inventory",
      method: "POST",
      body: item,
    });
  },

  async updateItem(id, item) {
    // Payload: Object with updated item details
    // Example: {
    //   "name": "Updated Product",        // Updated item name (string)
    //   "quantity": 150,                  // Updated stock quantity (number)
    //   "minStockLevel": 25,              // Updated minimum stock (number)
    //   "description": "Updated desc",    // Updated description (string)
    //   "unitPrice": 34.99                // Updated price (number)
    // }
    // if 200 {
    //     "id": 1,
    //     "name": "Updated Product",
    //     "description": "Updated description",
    //     "quantity": 150,
    //     "minStockLevel": 25,
    //     "safetyStock": null,
    //     "alertEnabled": true,
    //     "actionEnabled": true,
    //     "autoCalculationEnabled": false,
    //     "unitPrice": 34.99,
    //     "createdAt": "2025-05-12T02:57:45.971117",
    //     "updatedAt": "2025-05-12T06:41:35.9183553"
    // }
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: `/api/inventory/${id}`,
      method: "PUT",
      body: item,
    });
  },

  async deleteItem(id) {
    // No payload: Deletes an item by its ID
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: `/api/inventory/${id}`,
      method: "DELETE",
    });
  },

  // Ordering from Supplier
  async getAllOrders() {
    // No payload: Retrieves all supplier orders
    // if 200 [
    //     {
    //         "id": 1,
    //         "item": {
    //             "id": 4,
    //             "name": "Intelligent Wool Shirt",
    //             "description": "Aliquid qui perferendis alias ullam.",
    //             "quantity": 24,
    //             "minStockLevel": 11,
    //             "safetyStock": null,
    //             "alertEnabled": true,
    //             "actionEnabled": true,
    //             "autoCalculationEnabled": false,
    //             "unitPrice": 465.29,
    //             "createdAt": "2025-05-12T02:57:46.043984",
    //             "updatedAt": "2025-05-12T02:58:54.036697"
    //         },
    //         "quantity": 3,
    //         "orderDate": "2025-05-12T02:57:58.209831",
    //         "totalPrice": 1395.8700000000001,
    //         "status": "COMPLETED"
    //     },
    //     {
    //         "id": 2,
    //         "item": {
    //             "id": 5,
    //             "name": "Fantastic Silk Clock",
    //             "description": "Eum et dolorum quo et.",
    //             "quantity": 37,
    //             "minStockLevel": 19,
    //             "safetyStock": null,
    //             "alertEnabled": true,
    //             "actionEnabled": true,
    //             "autoCalculationEnabled": false,
    //             "unitPrice": 1695.66,
    //             "createdAt": "2025-05-12T02:57:46.045983",
    //             "updatedAt": "2025-05-12T02:58:54.036697"
    //         },
    //         "quantity": 2,
    //         "orderDate": "2025-05-12T02:58:09.723312",
    //         "totalPrice": 3391.32,
    //         "status": "COMPLETED"
    //     },
    // ]
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: "/api/orders",
    });
  },

  async orderItemFromSupplier(itemId, quantity) {
    // Payload: Object specifying the item and quantity to order
    // Example: {
    //   "itemId": 1,                      // ID of the item to order (number)
    //   "quantity": 10                    // Quantity to order (number)
    // }
    // if success 200 {
    //     "success": true,
    //     "message": "Order accepted"
    // }
    return apiRequest({
      base: BASE_URLS.supplier,
      endpoint: "/api/orders",
      method: "POST",
      body: { itemId, quantity },
      headers: {
        "X-API-Key": SUPPLIER_API_KEY, // Required for supplier authentication
      },
    });
  },

  // Frontend Data
  async getItemsNearMinimum() {
    // No payload: Retrieves items with stock near minimum levels
    // if success 200 example [
    //     {
    //         "id": 1,
    //         "name": "Updated Product",
    //         "description": "Updated description",
    //         "quantity": 1,
    //         "minStockLevel": 25,
    //         "safetyStock": 30,
    //         "alertEnabled": false,
    //         "actionEnabled": false,
    //         "autoCalculationEnabled": false,
    //         "unitPrice": 34.99,
    //         "createdAt": "2025-05-12T02:57:45.971117",
    //         "updatedAt": "2025-05-12T07:04:56.642477"
    //     }
    // ]
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: "/api/inventory/near-minimum",
    });
  },

  async getInventoryHistory(id) {
    // No payload: Retrieves inventory history for a specific item
    // if 200 example [
    //     {
    //         "id": 1,
    //         "item": {
    //             "id": 1,
    //             "name": "Updated Product",
    //             "description": "Updated description",
    //             "quantity": 1,
    //             "minStockLevel": 25,
    //             "safetyStock": 30,
    //             "alertEnabled": false,
    //             "actionEnabled": false,
    //             "autoCalculationEnabled": false,
    //             "unitPrice": 34.99,
    //             "createdAt": "2025-05-12T02:57:45.971117",
    //             "updatedAt": "2025-05-12T07:04:56.642477"
    //         },
    //         "previousQuantity": 0,
    //         "newQuantity": 12,
    //         "changeType": "INITIAL_STOCK",
    //         "changeDate": "2025-05-12T02:57:46.001424",
    //         "referenceId": null,
    //         "referenceType": null
    //     },
    //     {
    //         "id": 19,
    //         "item": {
    //             "id": 1,
    //             "name": "Updated Product",
    //             "description": "Updated description",
    //             "quantity": 1,
    //             "minStockLevel": 25,
    //             "safetyStock": 30,
    //             "alertEnabled": false,
    //             "actionEnabled": false,
    //             "autoCalculationEnabled": false,
    //             "unitPrice": 34.99,
    //             "createdAt": "2025-05-12T02:57:45.971117",
    //             "updatedAt": "2025-05-12T07:04:56.642477"
    //         },
    //         "previousQuantity": 9,
    //         "newQuantity": 21,
    //         "changeType": "RESTOCK",
    //         "changeDate": "2025-05-12T02:58:37.412403",
    //         "referenceId": null,
    //         "referenceType": "ORDER"
    //     },
    //     {
    //         "id": 20,
    //         "item": {
    //             "id": 1,
    //             "name": "Updated Product",
    //             "description": "Updated description",
    //             "quantity": 1,
    //             "minStockLevel": 25,
    //             "safetyStock": 30,
    //             "alertEnabled": false,
    //             "actionEnabled": false,
    //             "autoCalculationEnabled": false,
    //             "unitPrice": 34.99,
    //             "createdAt": "2025-05-12T02:57:45.971117",
    //             "updatedAt": "2025-05-12T07:04:56.642477"
    //         },
    //         "previousQuantity": 9,
    //         "newQuantity": 21,
    //         "changeType": "PURCHASE",
    //         "changeDate": "2025-05-12T02:58:42.669797",
    //         "referenceId": 10,
    //         "referenceType": "PURCHASE"
    //     },
    // ]
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: `/api/inventory/${id}/history`,
    });
  },

  async getInventoryHistoryByDateRange(id, startDate, endDate) {
    // No payload: Query parameters specify date range
    // Example: startDate=2025-05-11T23:41:26.792104, endDate=2025-05-11T23:41:26.824106
    // if 200 example [
    //     {
    //         "id": 1,
    //         "item": {
    //             "id": 1,
    //             "name": "Updated Product",
    //             "description": "Updated description",
    //             "quantity": 1,
    //             "minStockLevel": 25,
    //             "safetyStock": 30,
    //             "alertEnabled": false,
    //             "actionEnabled": false,
    //             "autoCalculationEnabled": false,
    //             "unitPrice": 34.99,
    //             "createdAt": "2025-05-12T02:57:45.971117",
    //             "updatedAt": "2025-05-12T07:04:56.642477"
    //         },
    //         "previousQuantity": 0,
    //         "newQuantity": 12,
    //         "changeType": "INITIAL_STOCK",
    //         "changeDate": "2025-05-12T02:57:46.001424",
    //         "referenceId": null,
    //         "referenceType": null
    //     },
    // ]
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: `/api/inventory/${id}/history/range?startDate=${startDate}&endDate=${endDate}`,
    });
  },

  // Testing
  async generateTestData() {
    // No payload: Generates test data for the inventory
    // if 200 no body return
    return apiRequest({
      base: BASE_URLS.inventory,
      endpoint: "/api/test/generate",
      method: "POST",
    });
  },
};

export default inventoryService;