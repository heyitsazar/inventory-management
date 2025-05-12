import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ShoppingCart, Delete } from '@mui/icons-material';

const PurchasedItems = ({
  nearMinimumItems,
  purchaseHistory,
  cartItems,
  loading,
  error,
  onOrder,
  onAddToCart,
  onRemoveFromCart,
  onCheckout,
}) => {
  const nearMinimumColumns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'quantity', headerName: 'Quantity', width: 120 },
    { field: 'minStockLevel', headerName: 'Min Stock', width: 120 },
    {
      field: 'unitPrice',
      headerName: 'Unit Price',
      width: 120,
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="outlined"
          startIcon={<ShoppingCart />}
          onClick={() => onAddToCart(params.id)}
          size="small"
        >
          Add to Reorder
        </Button>
      ),
    },
  ];

  const cartColumns = [
    { field: 'name', headerName: 'Name', width: 200 },
    {
      field: 'quantity',
      headerName: 'Quantity',
      width: 120,
      renderCell: (params) => (
        <TextField
          type="number"
          value={params.value}
          onChange={(e) => {
            const newQuantity = Number(e.target.value);
            if (newQuantity > 0) {
              onAddToCart(params.id, newQuantity - params.value);
            }
          }}
          size="small"
          sx={{ width: 80 }}
        />
      ),
    },
    {
      field: 'totalPrice',
      headerName: 'Price',
      width: 120,
      valueGetter: (params) => params.row.price * params.row.quantity,
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 100,
      renderCell: (params) => (
        <IconButton
          onClick={() => onRemoveFromCart(params.id)}
          color="error"
          size="small"
        >
          <Delete />
        </IconButton>
      ),
    },
  ];

  const purchaseHistoryColumns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'quantity', headerName: 'Quantity', width: 120 },
    {
      field: 'unitPrice',
      headerName: 'Unit Price',
      width: 120,
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
    },
    { field: 'status', headerName: 'Status', width: 120 },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 200,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
  ];

  const nearMinimumRows = nearMinimumItems.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    minStockLevel: item.minStockLevel,
    unitPrice: item.unitPrice,
  }));

  const cartRows = cartItems.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price,
  }));

  const purchaseHistoryRows = purchaseHistory.map((purchase) => ({
    id: purchase.purchaseId,
    name: purchase.name,
    quantity: purchase.quantity,
    unitPrice: purchase.unitPrice,
    status: purchase.status,
    timestamp: purchase.timestamp,
  }));

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Purchased Items & Reordering
      </Typography>

      {/* Near Minimum Stock Items */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        Items Near Minimum Stock
      </Typography>
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" align="center" py={4}>
          {error}
        </Typography>
      ) : nearMinimumRows.length === 0 ? (
        <Typography color="textSecondary" align="center" py={4}>
          No items near minimum stock.
        </Typography>
      ) : (
        <Box sx={{ height: 300, width: '100%', mb: 4 }}>
          <DataGrid
            rows={nearMinimumRows}
            columns={nearMinimumColumns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
            sx={{ border: 0 }}
          />
        </Box>
      )}

      {/* Reorder Cart */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        Reorder Cart
      </Typography>
      {cartRows.length === 0 ? (
        <Typography color="textSecondary" align="center" py={4}>
          No items in reorder cart.
        </Typography>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Box sx={{ height: 300, width: '100%' }}>
            <DataGrid
              rows={cartRows}
              columns={cartColumns}
              pageSize={5}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              sx={{ border: 0 }}
            />
          </Box>
          <Button
            variant="contained"
            onClick={onCheckout}
            sx={{ mt: 2 }}
          >
            Place Reorders
          </Button>
        </Box>
      )}

      {/* Purchase History */}
      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
        Purchase History
      </Typography>
      {purchaseHistoryRows.length === 0 ? (
        <Typography color="textSecondary" align="center" py={4}>
          No purchase history available.
        </Typography>
      ) : (
        <Box sx={{ height: 300, width: '100%' }}>
          <DataGrid
            rows={purchaseHistoryRows}
            columns={purchaseHistoryColumns}
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

export default PurchasedItems;