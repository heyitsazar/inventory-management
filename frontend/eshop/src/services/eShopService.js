import { apiRequest,BASE_URL } from "../api.js";

// eShopService.js

const eShopService = {
  async getAllItems() {
    // No payload: Retrieves all items available in the eShop

    //if 200 example 
    // [
//   {
//     "id": 1,
//     "name": "Critical Stock Item",
//     "description": "This item is always near minimum stock for testing",
//     "quantity": 15,
//     "minStockLevel": 10,
//     "safetyStock": null,
//     "alertEnabled": true,
//     "actionEnabled": true,
//     "autoCalculationEnabled": false,
//     "unitPrice": 999.99,
//     "createdAt": "2025-05-12T02:57:45.971117",
//     "updatedAt": "2025-05-12T02:58:54.034183"
//   },
//   {
//     "id": 2,
//     "name": "Intelligent Rubber Bag",
//     "description": "Est quia quo ducimus asperiores tenetur omnis.",
//     "quantity": 25,
//     "minStockLevel": 14,
//     "safetyStock": null,
//     "alertEnabled": true,
//     "actionEnabled": true,
//     "autoCalculationEnabled": false,
//     "unitPrice": 1716.55,
//     "createdAt": "2025-05-12T02:57:46.039995",
//     "updatedAt": "2025-05-12T03:03:08.271707"
//   },
// ]

    return apiRequest({
      base: BASE_URL.eShop,
      endpoint: "/api/items",
    });
  },

  async buyItem(itemId) {
    // No payload: Initiates a purchase for the specified item's ID
    // The itemId is passed in the URL (e.g., /api/purchases/2)

    //if 200 nothing
    return apiRequest({
      base: BASE_URL.eShop,
      endpoint: `/api/purchases/${itemId}`,
      method: "POST",
    });
  },
};

export default eShopService;