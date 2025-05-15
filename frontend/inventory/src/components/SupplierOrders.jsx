import { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  CircularProgress,
  IconButton,
  Divider,
  Grid,
} from '@mui/material';
import { Delete, AddShoppingCart } from '@mui/icons-material';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';

const SupplierOrders = () => {
  const [nearMinimumItems, setNearMinimumItems] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartItems, setCartItems] = useState(() => JSON.parse(localStorage.getItem('cartItems')) || []);
  const [purchaseHistory, setPurchaseHistory] = useState(() => JSON.parse(localStorage.getItem('purchaseHistory')) || []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderQuantities, setOrderQuantities] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [nearMinimumData, itemsData, ordersData] = await Promise.all([
          inventoryService.getItemsNearMinimum(),
          inventoryService.getAllItems(),
          inventoryService.getAllOrders(),
        ]);
        setNearMinimumItems(nearMinimumData);
        setItems(itemsData);
        setOrders(ordersData);
        setError(null);
      } catch (err) {
        setError('Failed to load data.');
        toast.error('Failed to load data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('purchaseHistory', JSON.stringify(purchaseHistory));
  }, [purchaseHistory]);

  const handleQuantityChange = (itemId, value) => {
    setOrderQuantities((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleOrder = async (itemId, quantity) => {
    try {
      await inventoryService.orderItemFromSupplier(itemId, quantity);
      const item = items.find((i) => i.id === itemId);
      setPurchaseHistory((prev) => [
        ...prev,
        {
          purchaseId: uuidv4(),
          id: itemId,
          name: item?.name || 'Unknown',
          unitPrice: item?.unitPrice || 0,
          quantity,
          timestamp: new Date().toISOString(),
          status: 'Ordered',
        },
      ]);
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error('Failed to place order.');
      console.error(err);
    }
  };

  const handleAddToCart = (itemId) => {
    const itemToAdd = items.find((item) => item.id === itemId);
    const existingItem = cartItems.find((item) => item.id === itemId);

    if (existingItem) {
      setCartItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCartItems((prevItems) => [
        ...prevItems,
        {
          id: itemId,
          name: itemToAdd.name,
          price: itemToAdd.unitPrice,
          quantity: 1,
        },
      ]);
    }
    toast.success('Added to reorder cart!');
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
    toast.info('Removed from reorder cart.');
  };

  const handleCheckout = async () => {
    try {
      for (const cartItem of cartItems) {
        await inventoryService.orderItemFromSupplier(cartItem.id, cartItem.quantity);
        setPurchaseHistory((prev) => [
          ...prev,
          {
            purchaseId: uuidv4(),
            id: cartItem.id,
            name: cartItem.name,
            unitPrice: cartItem.price,
            quantity: cartItem.quantity,
            timestamp: new Date().toISOString(),
            status: 'Ordered',
          },
        ]);
      }
      setCartItems([]);
      toast.success('Reorders placed successfully!');
    } catch (err) {
      toast.error('Failed to place reorders.');
      console.error(err);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>Supplier Orders</Typography>

      {/* Low Stock Items Section */}
      <Typography variant="h6" fontWeight="medium" mb={2}>Low Stock Items</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" variant="h6" align="center">{error}</Typography>
      ) : nearMinimumItems.length === 0 ? (
        <Typography variant="body1" align="center">No low stock items.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>Name</TableCell>
                <TableCell>Current Quantity</TableCell>
                <TableCell>Min Stock Level</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Auto Reorder</TableCell>
                <TableCell>Stock Optimization</TableCell>
                <TableCell>Order Quantity</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {nearMinimumItems.map((item) => (
                <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.minStockLevel}</TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>{item.actionEnabled ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{item.autoCalculationEnabled ? 'Yes' : 'No'}</TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={orderQuantities[item.id] || ''}
                      onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                      sx={{ width: '80px' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleOrder(item.id, parseInt(orderQuantities[item.id]) || 1)}
                      disabled={!orderQuantities[item.id] || parseInt(orderQuantities[item.id]) <= 0}
                      sx={{ mr: 1 }}
                    >
                      Order
                    </Button>
                    <IconButton onClick={() => handleAddToCart(item.id)} size="small">
                      <AddShoppingCart />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reorder Cart Section */}
      <Typography variant="h6" fontWeight="medium" mb={2}>Reorder Cart</Typography>
      {cartItems.length === 0 ? (
        <Typography variant="body1" align="center">Cart is empty.</Typography>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>${(item.quantity * item.price).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleRemoveFromCart(item.id)} size="small" color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" color="primary" onClick={handleCheckout}>
            Place Reorders
          </Button>
        </Box>
      )}

      {/* Purchase History Section */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6" fontWeight="medium" mb={2}>Manual Order History</Typography>
      {purchaseHistory.length === 0 ? (
        <Typography variant="body1" align="center">No purchase history.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>Purchase ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseHistory.map((purchase) => (
                <TableRow key={purchase.purchaseId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{purchase.purchaseId}</TableCell>
                  <TableCell>{purchase.name}</TableCell>
                  <TableCell>{purchase.quantity}</TableCell>
                  <TableCell>${purchase.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>${(purchase.quantity * purchase.unitPrice).toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(purchase.timestamp), 'PPp')}</TableCell>
                  <TableCell>{purchase.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Supplier Orders Section */}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6" fontWeight="medium" mb={2}>Supplier Order History</Typography>
      {orders.length === 0 ? (
        <Typography variant="body1" align="center">No supplier orders available.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>Order ID</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Total Price</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.item.name}</TableCell>
                  <TableCell>{order.quantity}</TableCell>
                  <TableCell>${order.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(order.orderDate), 'PPp')}</TableCell>
                  <TableCell>{order.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default SupplierOrders;