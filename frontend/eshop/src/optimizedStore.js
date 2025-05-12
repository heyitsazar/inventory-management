// Place this file in your project as optimizedStore.js

import { useState, useEffect, useRef } from 'react';
import eShopService from './services/eShopService'; // Adjust the path as needed

// This creates a store that prevents unnecessary re-renders
export function createOptimizedStore(initialState = {}) {
  // Shared state that can be accessed by all components
  let state = { ...initialState };
  
  // Store subscribers
  const listeners = new Map();
  
  // Update listeners only for the specific paths that changed
  const notifyListeners = (changedPaths) => {
    listeners.forEach((listener, key) => {
      // Check if this listener cares about any of the changed paths
      const shouldUpdate = changedPaths.some(path => 
        key === path || key.startsWith(`${path}.`) || path.startsWith(`${key}.`)
      );
      
      if (shouldUpdate) {
        listener();
      }
    });
  };
  
  // Update state without unnecessary re-renders
  const setState = (partialState, path = '') => {
    const changedPaths = [];
    
    // Helper to update nested state and track changes
    const updateNestedState = (target, source, currentPath) => {
      let hasChanged = false;
      
      for (const key in source) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && 
            target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
          // Recursively update nested objects
          const nestedChanged = updateNestedState(target[key], source[key], newPath);
          if (nestedChanged) {
            hasChanged = true;
            changedPaths.push(newPath);
          }
        } else if (target[key] !== source[key]) {
          // Update value and mark as changed
          target[key] = source[key];
          hasChanged = true;
          changedPaths.push(newPath);
        }
      }
      
      return hasChanged;
    };
    
    // Update state
    if (path) {
      // Update nested path
      const pathParts = path.split('.');
      let current = state;
      
      // Navigate to the target object
      for (let i = 0; i < pathParts.length - 1; i++) {
        if (!current[pathParts[i]]) {
          current[pathParts[i]] = {};
        }
        current = current[pathParts[i]];
      }
      
      // Update the value
      const lastKey = pathParts[pathParts.length - 1];
      const oldValue = current[lastKey];
      
      if (oldValue !== partialState) {
        current[lastKey] = partialState;
        changedPaths.push(path);
      }
    } else {
      // Update root state
      updateNestedState(state, partialState, '');
    }
    
    if (changedPaths.length > 0) {
      notifyListeners(changedPaths);
    }
    
    return state;
  };
  
  // Get current state
  const getState = () => state;
  
  // Custom hook to use the store
  const useStore = (selector, deps = []) => {
    // Create a stable reference to the selector
    const selectorRef = useRef(selector);
    selectorRef.current = selector;
    
    // State to trigger re-renders
    const [selectedState, setSelectedState] = useState(() => 
      selectorRef.current(state)
    );
    
    // Unique key for this component's subscription
    const pathKey = useRef(deps.join('.') || 'root');
    
    // Update component state when store changes
    useEffect(() => {
      const handleChange = () => {
        const newSelectedState = selectorRef.current(state);
        setSelectedState(prevState => {
          // Only trigger re-render if selected state actually changed
          if (JSON.stringify(prevState) !== JSON.stringify(newSelectedState)) {
            return newSelectedState;
          }
          return prevState;
        });
      };
      
      // Subscribe to store changes
      listeners.set(pathKey.current, handleChange);
      
      return () => {
        // Unsubscribe when component unmounts
        listeners.delete(pathKey.current);
      };
    }, []);
    
    return selectedState;
  };
  
  // Get a specific product by ID with memoization
  const useProduct = (productId) => {
    return useStore(
      state => state.products?.find(p => p.id === productId),
      ['products', productId]
    );
  };
  
  // Update a specific product's quantity
  const updateProductQuantity = (productId, newQuantity) => {
    const productIndex = state.products?.findIndex(p => p.id === productId);
    if (productIndex === -1 || productIndex === undefined) return;
    
    // Create a new product object with updated quantity
    const updatedProduct = {
      ...state.products[productIndex],
      quantity: newQuantity
    };
    
    // Update only this specific product in the array
    const newProducts = [...state.products];
    newProducts[productIndex] = updatedProduct;
    
    setState({ products: newProducts }, 'products');
  };
  
  // Fetch all products from API
  const fetchProducts = async () => {
    try {
      setState({ loading: true });
      const products = await eShopService.getAllItems();
      setState({ 
        products,
        loading: false,
        error: null
      });
      return products;
    } catch (error) {
      setState({ 
        loading: false,
        error: 'Failed to load products'
      });
      console.error('Error fetching products:', error);
      return [];
    }
  };
  
  // Buy a product using the eShopService
  const buyProduct = async (productId) => {
    try {
      const product = state.products?.find(p => p.id === productId);
      if (!product || product.quantity <= 0) {
        console.error('Product not available');
        return false;
      }
      
      // Call the API to buy the item
      await eShopService.buyItem(productId);
      
      // Update the product quantity in our store
      updateProductQuantity(productId, Math.max(0, product.quantity - 1));
      
      // Add to purchase history
      const newPurchase = {
        purchaseId: `purchase-${Date.now()}`,
        id: productId,
        name: product.name,
        unitPrice: product.unitPrice,
        category: product.category || 'N/A',
        timestamp: new Date().toISOString(),
        quantity: 1,
        status: 'Completed',
      };
      
      setState({ 
        purchaseHistory: [...(state.purchaseHistory || []), newPurchase] 
      }, 'purchaseHistory');
      
      return true;
    } catch (err) {
      console.error('Buy failed:', err);
      setState({
        error: 'Failed to purchase item'
      });
      return false;
    }
  };
  
  // Add to cart
  const addToCart = (productId) => {
    const product = state.products?.find(p => p.id === productId);
    if (!product || product.quantity <= 0) {
      return false;
    }
    
    const cartItems = state.cartItems || [];
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
      // Update existing item quantity
      setState({
        cartItems: cartItems.map(item => 
          item.id === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }, 'cartItems');
    } else {
      // Add new item to cart
      setState({
        cartItems: [
          ...cartItems,
          {
            id: productId,
            name: product.name,
            price: product.unitPrice,
            quantity: 1
          }
        ]
      }, 'cartItems');
    }
    
    return true;
  };
  
  // Remove from cart
  const removeFromCart = (productId) => {
    const cartItems = state.cartItems || [];
    setState({
      cartItems: cartItems.filter(item => item.id !== productId)
    }, 'cartItems');
  };
  
  // Checkout functionality
  const checkout = async () => {
    try {
      const cartItems = state.cartItems || [];
      if (cartItems.length === 0) return false;
      
      const newPurchases = [];
      
      // Process each cart item
      for (const item of cartItems) {
        // Verify product exists and has enough quantity
        const product = state.products?.find(p => p.id === item.id);
        if (!product || product.quantity < item.quantity) {
          throw new Error(`Not enough stock for ${item.name}`);
        }
        
        // Call API for each quantity
        for (let i = 0; i < item.quantity; i++) {
          await eShopService.buyItem(item.id);
        }
        
        // Update product quantity
        updateProductQuantity(
          item.id, 
          Math.max(0, product.quantity - item.quantity)
        );
        
        // Create purchase record
        newPurchases.push({
          purchaseId: `purchase-${Date.now()}-${item.id}`,
          id: item.id,
          name: item.name,
          unitPrice: product.unitPrice,
          category: product.category || 'N/A',
          timestamp: new Date().toISOString(),
          quantity: item.quantity,
          status: 'Completed',
        });
      }
      
      // Update purchase history
      setState({
        purchaseHistory: [...(state.purchaseHistory || []), ...newPurchases]
      }, 'purchaseHistory');
      
      // Clear cart
      setState({
        cartItems: [],
        cartOpen: false
      });
      
      return true;
    } catch (err) {
      console.error('Checkout failed:', err);
      setState({
        error: `Checkout failed: ${err.message}`
      });
      return false;
    }
  };
  
  // Toggle cart visibility
  const toggleCart = () => {
    setState({
      cartOpen: !state.cartOpen
    });
  };
  
  return {
    getState,
    setState,
    useStore,
    useProduct,
    updateProductQuantity,
    fetchProducts,
    buyProduct,
    addToCart,
    removeFromCart,
    checkout,
    toggleCart
  };
}

// Initialize your store with your app's initial state
const store = createOptimizedStore({
  products: [],
  purchaseHistory: [],
  cartItems: [],
  cartOpen: false,
  loading: false,
  error: null,
  searchTerm: '',
  activeCategory: 'all',
  sortOption: 'featured'
});

export default store;