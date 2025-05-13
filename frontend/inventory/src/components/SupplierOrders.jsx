import { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress } from '@mui/material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const SupplierOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getAllOrders();
        setOrders(data);
        setError(null);
      } catch (err) {
        setError('Failed to load orders.');
        toast.error('Failed to load orders.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3 }}>
      <Typography variant="h5" mb={3}>Supplier Orders</Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : orders.length === 0 ? (
        <Typography>No orders available.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
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


