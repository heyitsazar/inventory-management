import { DataGrid } from '@mui/x-data-grid';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

const SupplierOrders = ({ orders, loading, error }) => {
  const columns = [
    { field: 'id', headerName: 'Order ID', width: 100 },
    { field: 'itemName', headerName: 'Item Name', width: 200, valueGetter: (params) => params.row.item.name },
    { field: 'quantity', headerName: 'Quantity', width: 120 },
    {
      field: 'totalPrice',
      headerName: 'Total Price',
      width: 150,
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
    },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'orderDate',
      headerName: 'Order Date',
      width: 200,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
  ];

  const rows = orders.map((order) => ({
    id: order.id,
    item: order.item,
    quantity: order.quantity,
    totalPrice: order.totalPrice,
    status: order.status,
    orderDate: order.orderDate,
  }));

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Supplier Orders
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" py={4}>
          {error}
        </Typography>
      ) : rows.length === 0 ? (
        <Typography color="textSecondary" align="center" py={4}>
          No orders available.
        </Typography>
      ) : (
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
            sx={{ border: 0 }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default SupplierOrders;