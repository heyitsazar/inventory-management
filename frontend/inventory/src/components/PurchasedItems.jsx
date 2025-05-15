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
  CircularProgress,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const PurchaseItems = () => {
  const [purchases, setPurchases] = useState([]);
  const [filteredPurchases, setFilteredPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    source: '',
    itemName: '',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        setLoading(true);
        const response = await inventoryService.getAllPurchases();
        setPurchases(response.data);
        setFilteredPurchases(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to load purchase history.');
        toast.error('Failed to load purchase history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchases();
  }, []);

  useEffect(() => {
    const applyFilters = () => {
      let result = [...purchases];

      if (filters.source) {
        result = result.filter((purchase) => purchase.source === filters.source);
      }

      if (filters.itemName) {
        result = result.filter((purchase) =>
          purchase.item.name.toLowerCase().includes(filters.itemName.toLowerCase())
        );
      }

      if (filters.startDate) {
        result = result.filter(
          (purchase) => new Date(purchase.purchaseDate) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        result = result.filter(
          (purchase) => new Date(purchase.purchaseDate) <= new Date(filters.endDate)
        );
      }

      setFilteredPurchases(result);
    };
    applyFilters();
  }, [filters, purchases]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      source: '',
      itemName: '',
      startDate: null,
      endDate: null,
    });
  };

  // Calculate statistics
  const totalPurchases = filteredPurchases.length;
  const totalQuantity = filteredPurchases.reduce((sum, purchase) => sum + purchase.quantity, 0);
  const totalSpent = filteredPurchases
    .reduce((sum, purchase) => sum + purchase.totalPrice, 0)
    .toFixed(2);
  const averageUnitPrice =
    filteredPurchases.length > 0
      ? (
          filteredPurchases.reduce((sum, purchase) => sum + purchase.item.unitPrice, 0) /
          filteredPurchases.length
        ).toFixed(2)
      : 0;

  // Get unique sources for the dropdown
  const uniqueSources = [...new Set(purchases.map((purchase) => purchase.source))];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, maxWidth: 1200, mx: 'auto', mt: 4 }}>
        <Typography variant="h4" fontWeight="bold" mb={4}>
          Client Purchase History
        </Typography>

        {/* Filters */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="medium" mb={2}>
            Filters
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={filters.source}
                  label="Source"
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {uniqueSources.map((source) => (
                    <MenuItem key={source} value={source}>
                      {source}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Item Name"
                size="small"
                value={filters.itemName}
                onChange={(e) => handleFilterChange('itemName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} size="small" fullWidth />}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" color="secondary" onClick={clearFilters}>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Statistics */}
        <Box mb={4}>
          <Typography variant="h6" fontWeight="medium" mb={2}>
            Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Purchases
                  </Typography>
                  <Typography variant="h6">{totalPurchases}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Quantity
                  </Typography>
                  <Typography variant="h6">{totalQuantity}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                  <Typography variant="h6">${totalSpent}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Average Unit Price
                  </Typography>
                  <Typography variant="h6">${averageUnitPrice}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Purchase History Table */}
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        ) : filteredPurchases.length === 0 ? (
          <Typography variant="body1" align="center">
            No purchase history matches the filters.
          </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell>Purchase ID</TableCell>
                  <TableCell>Item Name</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Total Price</TableCell>
                  <TableCell>Auto Reorder</TableCell>
                  <TableCell>Stock Optimization</TableCell>
                  <TableCell>Purchase Date</TableCell>
                  <TableCell>Source</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                    <TableCell>{purchase.id}</TableCell>
                    <TableCell>{purchase.item.name}</TableCell>
                    <TableCell>{purchase.quantity}</TableCell>
                    <TableCell>${purchase.item.unitPrice.toFixed(2)}</TableCell>
                    <TableCell>${purchase.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>{purchase.item.actionEnabled ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{purchase.item.autoCalculationEnabled ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{format(new Date(purchase.purchaseDate), 'PPp')}</TableCell>
                    <TableCell>{purchase.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default PurchaseItems;