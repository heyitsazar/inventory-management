import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../services/inventoryService';
import {
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, CircularProgress, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, Chip, IconButton, Tooltip, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails, Card, CardContent,
  Divider, Stack, useTheme, Alert, Fade
} from '@mui/material';
import {
  Line, Bar, Pie
} from 'react-chartjs-2';
import {
  Chart as ChartJS, LineElement, PointElement, CategoryScale,
  LinearScale, Title, Tooltip as ChartTooltip, Legend,
  BarElement, ArcElement
} from 'chart.js';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';
import { toast } from 'react-toastify';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PrintIcon from '@mui/icons-material/Print';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DateRangeIcon from '@mui/icons-material/DateRange';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BugReportIcon from '@mui/icons-material/BugReport';
import InsightsIcon from '@mui/icons-material/Insights';
import TableChartIcon from '@mui/icons-material/TableChart';
import { debounce } from 'lodash';

ChartJS.register(
  LineElement, PointElement, BarElement, ArcElement, CategoryScale,
  LinearScale, Title, ChartTooltip, Legend
);

// Predefined date range options
const DATE_RANGES = [
  { label: 'Today', value: 'today', days: 0 },
  { label: 'Last 7 Days', value: '7days', days: 7 },
  { label: 'Last 30 Days', value: '30days', days: 30 },
  { label: 'Last 90 Days', value: '90days', days: 90 },
  { label: 'Custom Range', value: 'custom', days: null },
];

const CHART_TYPES = [
  { label: 'Line Chart', value: 'line' },
  { label: 'Bar Chart', value: 'bar' },
  { label: 'Pie Chart', value: 'pie' },
];

const InventoryHistory = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // State for inventory data
  const [items, setItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [itemDetails, setItemDetails] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({ refresh: false, reorder: false, testData: false });
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [chartType, setChartType] = useState('line');
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });

  // Filter state
  const [filters, setFilters] = useState({
    dateRangeType: '30days',
    startDate: '',
    endDate: '',
    changeTypes: [],
    minQuantity: '',
    maxQuantity: '',
    referenceType: '',
  });

  // Fetch all items on mount and select the first item by default
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const itemList = await inventoryService.getAllItems();
        if (!Array.isArray(itemList) || itemList.length === 0) {
          throw new Error('No items found in inventory');
        }
        setItems(itemList);
        // Set the first item as default
        setSelectedItemId(itemList[0].id);
        setError(null);
      } catch (err) {
        const errorMessage = err.message.includes('404')
          ? 'No items found in inventory'
          : 'Failed to fetch inventory items';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Initialize date range when selectedItemId changes
  useEffect(() => {
    if (selectedItemId) {
      handleDateRangeChange(filters.dateRangeType);
    }
  }, [selectedItemId]);

  // Fetch item details and history when selectedItemId changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedItemId) return;

      try {
        setLoading(true);

        // Fetch item details
        const itemData = await inventoryService.getItemById(selectedItemId);
        if (!itemData) throw new Error('Item not found');
        setItemDetails(itemData);

        // Fetch history data
        const historyData = await inventoryService.getInventoryHistory(selectedItemId);
        if (!Array.isArray(historyData)) throw new Error('Invalid history data');
        setHistory(historyData);

        // Apply initial filters
        applyFilters(historyData);

        setError(null);
        showNotification(`Successfully loaded history for ${itemData.name}`, 'success');
      } catch (err) {
        const errorMessage = err.message.includes('404')
          ? 'Item not found'
          : err.message.includes('Invalid history data')
            ? 'Invalid history data received'
            : 'Failed to fetch inventory data';
        setError(errorMessage);
     
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedItemId]);

  // Show notification helper
  const showNotification = (message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  // Handle date range type change
  const handleDateRangeChange = (rangeType) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    let startDate = '';
    let endDate = format(today, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

    if (rangeType !== 'custom') {
      const selectedRange = DATE_RANGES.find(range => range.value === rangeType);
      if (selectedRange && selectedRange.days !== null) {
        const start = subDays(today, selectedRange.days);
        start.setHours(0, 0, 0, 0);
        startDate = format(start, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      }
    }

    setFilters(prev => ({
      ...prev,
      dateRangeType: rangeType,
      startDate: rangeType === 'custom' ? prev.startDate : startDate,
      endDate: rangeType === 'custom' ? prev.endDate : endDate,
    }));

    if (rangeType !== 'custom' && startDate && endDate && selectedItemId) {
      fetchFilteredData(startDate, endDate);
    }
  };

  // Fetch data with date filters from API
  const fetchFilteredData = async (startDate, endDate) => {
    if (!selectedItemId || !startDate || !endDate) return;

    try {
      setLoading(true);
      const data = await inventoryService.getInventoryHistoryByDateRange(selectedItemId, startDate, endDate);
      if (!Array.isArray(data)) throw new Error('Invalid history data');
      setHistory(data);
      applyFilters(data);
    } catch (err) {
      const errorMessage = err.message.includes('Invalid history data')
        ? 'Invalid history data received'
        : 'Failed to fetch filtered history';
      setError(errorMessage);
     
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced filter application
  const applyFilters = useCallback(debounce((data = history) => {
    let filtered = [...data];

    if (filters.changeTypes.length > 0) {
      filtered = filtered.filter(item =>
        filters.changeTypes.includes(item.changeType)
      );
    }

    if (filters.minQuantity !== '') {
      filtered = filtered.filter(item =>
        item.newQuantity >= Number(filters.minQuantity)
      );
    }

    if (filters.maxQuantity !== '') {
      filtered = filtered.filter(item =>
        item.newQuantity <= Number(filters.maxQuantity)
      );
    }

    if (filters.referenceType) {
      filtered = filtered.filter(item =>
        item.referenceType === filters.referenceType
      );
    }

    setFilteredHistory(filtered);
  }, 300), [filters, history]);

  // Handle filter submission
  const handleApplyFilters = () => {
    if (filters.dateRangeType === 'custom') {
      if (!filters.startDate || !filters.endDate) {
        toast.error('Please provide both start and end dates');
        return;
      }
      // Validate date format
      try {
        parseISO(filters.startDate);
        parseISO(filters.endDate);
        fetchFilteredData(filters.startDate, filters.endDate);
      } catch (err) {
        toast.error('Invalid date format');
        console.error(err);
      }
    } else {
      applyFilters();
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setFilters({
      dateRangeType: '30days',
      startDate: '',
      endDate: '',
      changeTypes: [],
      minQuantity: '',
      maxQuantity: '',
      referenceType: '',
    });

    handleDateRangeChange('30days');
  };

  // Export history to CSV
  const exportToCSV = () => {
    if (filteredHistory.length === 0) return;

    const headers = [
      'Item Name',
      'Previous Quantity',
      'New Quantity',
      'Change Type',
      'Date',
      'Reference'
    ];

    const rows = filteredHistory.map(entry => [
      `"${entry.item.name}"`,
      entry.previousQuantity,
      entry.newQuantity,
      entry.changeType,
      format(parseISO(entry.changeDate), 'PPp'),
      entry.referenceType && entry.referenceId
        ? `${entry.referenceType} #${entry.referenceId}`
        : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventory-history-${selectedItemId}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('History exported to CSV successfully', 'success');
  };

  // Print history
  const printHistory = () => {
    window.print();
  };

  // Reorder item from supplier
  const handleReorder = async () => {
    if (!itemDetails) return;

    const quantityToOrder = itemDetails.minStockLevel * 2 - itemDetails.quantity;
    if (quantityToOrder <= 0) {
      toast.info('Stock level sufficient');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, reorder: true }));
      const response = await inventoryService.orderItemFromSupplier(itemDetails.id, quantityToOrder);
      if (response.success) {
        showNotification(response.message || 'Order placed successfully', 'success');
        toast.success('Order placed successfully');
        const historyData = await inventoryService.getInventoryHistory(selectedItemId);
        setHistory(historyData);
        applyFilters(historyData);
      } else {
        throw new Error('Order failed');
      }
    } catch (err) {
      const errorMessage = err.message.includes('401')
        ? 'Supplier authentication failed'
        : 'Failed to place order';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, reorder: false }));
    }
  };

  // Generate test data (for development)
  const handleGenerateTestData = async () => {
    try {
      setActionLoading(prev => ({ ...prev, testData: true }));
      await inventoryService.generateTestData();
      showNotification('Test data generated successfully', 'success');
      toast.success('Test data generated');
      const [itemList, itemData, historyData] = await Promise.all([
        inventoryService.getAllItems(),
        selectedItemId ? inventoryService.getItemById(selectedItemId) : Promise.resolve(null),
        selectedItemId ? inventoryService.getInventoryHistory(selectedItemId) : Promise.resolve([])
      ]);
      setItems(itemList);
      if (itemList.length > 0 && !selectedItemId) {
        setSelectedItemId(itemList[0].id);
      }
      if (itemData) {
        setItemDetails(itemData);
        setHistory(historyData);
        applyFilters(historyData);
      }
    } catch (err) {
      setError('Failed to generate test data');
      toast.error('Failed to generate test data');
      console.error(err);
    } finally {
      setActionLoading(prev => ({ ...prev, testData: false }));
    }
  };

  // Chart data preparation
  const chartData = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) return null;

    const sortedData = [...filteredHistory].sort((a, b) =>
      new Date(a.changeDate) - new Date(b.changeDate)
    );

    const labels = sortedData.map(entry => format(parseISO(entry.changeDate), 'MMM dd'));
    const quantities = sortedData.map(entry => entry.newQuantity);

    const changeTypeCounts = {};
    sortedData.forEach(entry => {
      changeTypeCounts[entry.changeType] = (changeTypeCounts[entry.changeType] || 0) + 1;
    });

    const changeTypes = Object.keys(changeTypeCounts);
    const counts = changeTypes.map(type => changeTypeCounts[type]);

    const backgroundColors = [
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 99, 132, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(153, 102, 255, 0.6)',
    ];

    return {
      line: {
        labels,
        datasets: [{
          label: 'Stock Quantity',
          data: quantities,
          borderColor: theme.palette.primary.main,
          backgroundColor: `${theme.palette.primary.main}20`,
          fill: true,
          tension: 0.3,
        }],
      },
      bar: {
        labels,
        datasets: [{
          label: 'Stock Quantity',
          data: quantities,
          backgroundColor: quantities.map((q, i) => {
            const prev = i > 0 ? quantities[i - 1] : q;
            return q >= prev
              ? 'rgba(75, 192, 192, 0.6)'
              : 'rgba(255, 99, 132, 0.6)';
          }),
          borderColor: quantities.map((q, i) => {
            const prev = i > 0 ? quantities[i - 1] : q;
            return q >= prev
              ? 'rgba(75, 192, 192, 1)'
              : 'rgba(255, 99, 132, 1)';
          }),
          borderWidth: 1,
        }],
      },
      pie: {
        labels: changeTypes,
        datasets: [{
          data: counts,
          backgroundColor: backgroundColors.slice(0, changeTypes.length),
          borderColor: backgroundColors.map(color => color.replace('0.6', '1')),
          borderWidth: 1,
        }],
      }
    };
  }, [filteredHistory, theme]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) return {
      totalChanges: 0,
      restocks: 0,
      purchases: 0,
      avgQuantityChange: 0,
      largestRestock: 0,
      largestPurchase: 0,
    };

    const restocks = filteredHistory.filter(entry => entry.changeType === 'RESTOCK');
    const purchases = filteredHistory.filter(entry => entry.changeType === 'PURCHASE');

    const quantityChanges = filteredHistory.map(entry =>
      entry.newQuantity - entry.previousQuantity
    );
    const avgChange = quantityChanges.length > 0
      ? quantityChanges.reduce((sum, change) => sum + change, 0) / quantityChanges.length
      : 0;

    const largestRestock = restocks.length > 0
      ? Math.max(...restocks.map(entry => entry.newQuantity - entry.previousQuantity))
      : 0;

    const largestPurchase = purchases.length > 0
      ? Math.max(...purchases.map(entry => entry.previousQuantity - entry.newQuantity))
      : 0;

    return {
      totalChanges: filteredHistory.length,
      restocks: restocks.length,
      purchases: purchases.length,
      avgQuantityChange: avgChange.toFixed(1),
      largestRestock,
      largestPurchase,
    };
  }, [filteredHistory]);

  // Get unique change types
  const changeTypes = useMemo(() => {
    return [...new Set(history.map(entry => entry.changeType))];
  }, [history]);

  // Get unique reference types
  const referenceTypes = useMemo(() => {
    return [...new Set(history.map(entry => entry.referenceType).filter(Boolean))];
  }, [history]);

  // Render chart
  const renderChart = () => {
    if (!chartData) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" p={4}>
          <Typography variant="body1" color="text.secondary">
            No data available for chart visualization
          </Typography>
        </Box>
      );
    }

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false },
      },
    };

    const lineAndBarOptions = {
      ...commonOptions,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Quantity' }
        },
        x: { title: { display: true, text: 'Date' } }
      },
    };

    const chartHeight = 300;

    switch (chartType) {
      case 'bar':
        return (
          <Box height={chartHeight}>
            <Bar data={chartData.bar} options={lineAndBarOptions} />
          </Box>
        );
      case 'pie':
        return (
          <Box height={chartHeight}>
            <Pie data={chartData.pie} options={commonOptions} />
          </Box>
        );
      case 'line':
      default:
        return (
          <Box height={chartHeight}>
            <Line data={chartData.line} options={lineAndBarOptions} />
          </Box>
        );
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 3 }}>
      {/* Header section */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'start', md: 'center' }}
        mb={3}
      >
        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Inventory History
          </Typography>
          <FormControl fullWidth size="small" sx={{ maxWidth: 300, mb: 1 }}>
            <InputLabel>Select Item</InputLabel>
            <Select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              label="Select Item"
            >
              {items.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name} (ID: {item.id})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {itemDetails && (
            <Typography variant="subtitle1" color="text.secondary">
              {itemDetails.name} (ID: {selectedItemId})
            </Typography>
          )}
        </Box>

        {selectedItemId && (
          <Box display="flex" gap={1} mt={{ xs: 2, md: 0 }}>
            <Tooltip title="Export to CSV">
              <IconButton onClick={exportToCSV} disabled={filteredHistory.length === 0}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print">
              <IconButton onClick={printHistory} disabled={filteredHistory.length === 0}>
                <PrintIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={async () => {
                  setActionLoading(prev => ({ ...prev, refresh: true }));
                  try {
                    const [itemData, historyData] = await Promise.all([
                      inventoryService.getItemById(selectedItemId),
                      inventoryService.getInventoryHistory(selectedItemId)
                    ]);
                    setItemDetails(itemData);
                    setHistory(historyData);
                    applyFilters(historyData);
                    showNotification('Data refreshed successfully', 'success');
                  } catch (err) {
                    setError('Failed to refresh data');
                    toast.error('Failed to refresh data');
                  } finally {
                    setActionLoading(prev => ({ ...prev, refresh: false }));
                  }
                }}
                disabled={actionLoading.refresh}
              >
                {actionLoading.refresh ? <CircularProgress size={24} /> : <RefreshIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="View Item Details">
              <IconButton onClick={() => navigate(`/inventory/${selectedItemId}`)}>
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reorder Item">
              <IconButton
                onClick={handleReorder}
                disabled={
                  !itemDetails ||
                  actionLoading.reorder ||
                  itemDetails.quantity >= itemDetails.minStockLevel * 2
                }
                color={itemDetails && itemDetails.quantity <= itemDetails.minStockLevel ? 'error' : 'primary'}
              >
                {actionLoading.reorder ? <CircularProgress size={24} /> : <ShoppingCartIcon />}
              </IconButton>
            </Tooltip>
            {process.env.NODE_ENV === 'development' && (
              <Tooltip title="Generate Test Data">
                <IconButton
                  onClick={handleGenerateTestData}
                  disabled={actionLoading.testData}
                >
                  {actionLoading.testData ? <CircularProgress size={24} /> : <BugReportIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </Box>

      {/* Notification */}
      <Fade in={notification.show}>
        <Box mb={3} sx={{ display: notification.show ? 'block' : 'none' }}>
          <Alert severity={notification.type} onClose={() => setNotification(prev => ({ ...prev, show: false }))}>
            {notification.message}
          </Alert>
        </Box>
      </Fade>

      {/* Main content */}
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            {error.includes('No items found') && (
              <Button
                variant="text"
                onClick={() => navigate('/inventory')}
                sx={{ ml: 2 }}
              >
                Back to Inventory
              </Button>
            )}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {error.includes('No items found')
              ? 'No items available in the inventory. Try adding items or generating test data.'
              : 'Please try selecting a different item or refreshing the page.'}
          </Typography>
        </Box>
      ) : items.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No items available in inventory
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/inventory')}
          >
            Go to Inventory
          </Button>
        </Box>
      ) : (
        <>
          {/* Filters accordion */}
          <Accordion
            expanded={isFilterExpanded}
            onChange={() => setIsFilterExpanded(!isFilterExpanded)}
            sx={{ mb: 3, boxShadow: theme.shadows[1], borderRadius: 1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: isFilterExpanded ? 'rgba(0, 0, 0, 0.03)' : 'transparent',
                borderBottom: isFilterExpanded ? `1px solid ${theme.palette.divider}` : 'none'
              }}
            >
              <Box display="flex" alignItems="center">
                <FilterListIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="subtitle1">Filters</Typography>
                {(filters.changeTypes.length > 0 || filters.referenceType || filters.minQuantity || filters.maxQuantity) && (
                  <Chip
                    label={`${filters.changeTypes.length + (filters.referenceType ? 1 : 0) + (filters.minQuantity ? 1 : 0) + (filters.maxQuantity ? 1 : 0)} active`}
                    size="small"
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={filters.dateRangeType}
                      onChange={(e) => handleDateRangeChange(e.target.value)}
                      label="Date Range"
                      startAdornment={<DateRangeIcon fontSize="small" sx={{ mr: 1, ml: -0.5 }} />}
                    >
                      {DATE_RANGES.map((range) => (
                        <MenuItem key={range.value} value={range.value}>
                          {range.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {filters.dateRangeType === 'custom' && (
                  <>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="Start Date"
                        type="datetime-local"
                        size="small"
                        fullWidth
                        value={filters.startDate ? filters.startDate.slice(0, 16) : ''}
                        onChange={(e) => {
                          try {
                            const date = new Date(e.target.value);
                            if (isNaN(date.getTime())) throw new Error('Invalid date');
                            setFilters({
                              ...filters,
                              startDate: format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
                            });
                          } catch (err) {
                            toast.error('Invalid start date');
                          }
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        label="End Date"
                        type="datetime-local"
                        size="small"
                        fullWidth
                        value={filters.endDate ? filters.endDate.slice(0, 16) : ''}
                        onChange={(e) => {
                          try {
                            const date = new Date(e.target.value);
                            if (isNaN(date.getTime())) throw new Error('Invalid date');
                            setFilters({
                              ...filters,
                              endDate: format(date, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
                            });
                          } catch (err) {
                            toast.error('Invalid end date');
                          }
                        }}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Change Types</InputLabel>
                    <Select
                      multiple
                      value={filters.changeTypes}
                      onChange={(e) => setFilters({ ...filters, changeTypes: e.target.value })}
                      label="Change Types"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {changeTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Reference Type</InputLabel>
                    <Select
                      value={filters.referenceType}
                      onChange={(e) => setFilters({ ...filters, referenceType: e.target.value })}
                      label="Reference Type"
                    >
                      <MenuItem value="">
                        <em>Any</em>
                      </MenuItem>
                      {referenceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <TextField
                    label="Min Quantity"
                    type="number"
                    size="small"
                    fullWidth
                    value={filters.minQuantity}
                    onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    label="Max Quantity"
                    type="number"
                    size="small"
                    fullWidth
                    value={filters.maxQuantity}
                    onChange={(e) => setFilters({ ...filters, maxQuantity: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" justifyContent="flex-end" gap={1} mt={1}>
                    <Button
                      variant="outlined"
                      onClick={handleResetFilters}
                      size="small"
                    >
                      Reset
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleApplyFilters}
                      size="small"
                    >
                      Apply Filters
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Stats cards */}
          {itemDetails && (
            <Grid container spacing={2} mb={3}>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Total Changes
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {stats.totalChanges}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Restocks
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.restocks}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Purchases
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.purchases}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Avg. Change
                  </Typography>
                  <Typography variant="h4" color={parseFloat(stats.avgQuantityChange) >= 0 ? 'success.main' : 'error.main'}>
                    {stats.avgQuantityChange > 0 ? '+' : ''}{stats.avgQuantityChange}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Largest Restock
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    +{stats.largestRestock}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <Paper sx={{ p: 2, height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Largest Purchase
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.largestPurchase > 0 ? '-' : ''}{stats.largestPurchase}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Tabs section */}
          {itemDetails && (
            <>
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label="Chart" icon={<InsightsIcon />} iconPosition="start" />
                <Tab label="Table" icon={<TableChartIcon />} iconPosition="start" />
              </Tabs>

              {/* Chart tab content */}
              {activeTab === 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">Stock Changes Visualization</Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Chart Type</InputLabel>
                      <Select
                        value={chartType}
                        onChange={(e) => setChartType(e.target.value)}
                        label="Chart Type"
                      >
                        {CHART_TYPES.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {renderChart()}
                </Paper>
              )}

              {/* Table tab content */}
              {activeTab === 1 && (
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" mb={2}>History Details</Typography>
                  {filteredHistory.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography color="text.secondary">No history records found matching your filters.</Typography>
                      <Button
                        variant="text"
                        color="primary"
                        onClick={handleResetFilters}
                        sx={{ mt: 1 }}
                      >
                        Reset Filters
                      </Button>
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Item</TableCell>
                            <TableCell>Previous</TableCell>
                            <TableCell>New</TableCell>
                            <TableCell>Change</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Reference</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredHistory.map((entry) => {
                            const change = entry.newQuantity - entry.previousQuantity;
                            const isPositive = change >= 0;

                            return (
                              <TableRow
                                key={entry.id}
                                sx={{
                                  '&:hover': { bgcolor: 'action.hover' },
                                  bgcolor: entry.changeType === 'RESTOCK'
                                    ? 'success.lighter'
                                    : entry.changeType === 'PURCHASE'
                                      ? 'error.lighter'
                                      : 'transparent'
                                }}
                              >
                                <TableCell>{format(parseISO(entry.changeDate), 'MMM dd, yyyy HH:mm')}</TableCell>
                                <TableCell>{entry.item.name}</TableCell>
                                <TableCell>{entry.previousQuantity}</TableCell>
                                <TableCell>{entry.newQuantity}</TableCell>
                                <TableCell>
                                  <Typography
                                    component="span"
                                    color={isPositive ? 'success.main' : 'error.main'}
                                    fontWeight="medium"
                                  >
                                    {isPositive ? '+' : ''}{change}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={entry.changeType}
                                    size="small"
                                    color={
                                      entry.changeType === 'RESTOCK'
                                        ? 'success'
                                        : entry.changeType === 'PURCHASE'
                                          ? 'error'
                                          : entry.changeType === 'INITIAL_STOCK'
                                            ? 'info'
                                            : 'default'
                                    }
                                  />
                                </TableCell>
                                <TableCell>
                                  {entry.referenceType && entry.referenceId ? (
                                    <Chip
                                      label={`${entry.referenceType} #${entry.referenceId}`}
                                      size="small"
                                      variant="outlined"
                                      onClick={async () => {
                                        if (entry.referenceType === 'ORDER') {
                                          try {
                                            const orders = await inventoryService.getAllOrders();
                                            const orderExists = orders.some(order => order.id === entry.referenceId);
                                            if (orderExists) {
                                              navigate(`/orders/${entry.referenceId}`);
                                            } else {
                                              toast.error('Order not found');
                                            }
                                          } catch (err) {
                                            toast.error('Failed to verify order');
                                          }
                                        } else if (entry.referenceType === 'PURCHASE') {
                                          navigate(`/purchases/${entry.referenceId}`);
                                        }
                                      }}
                                      clickable={entry.referenceType === 'ORDER' || entry.referenceType === 'PURCHASE'}
                                    />
                                  ) : (
                                    '-'
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Paper>
              )}
            </>
          )}

          {/* Additional Insights Section */}
          {itemDetails && filteredHistory.length > 0 && (
            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Quick Insights
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Stack spacing={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Current Quantity:</Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color={
                            itemDetails.quantity <= itemDetails.minStockLevel
                              ? 'error.main'
                              : itemDetails.quantity <= itemDetails.minStockLevel * 1.2
                                ? 'warning.main'
                                : 'success.main'
                          }
                        >
                          {itemDetails.quantity} units
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Inventory Turnover Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {stats.purchases > 0
                            ? (stats.purchases / filteredHistory.length * 100).toFixed(1) + '%'
                            : 'N/A'}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Restock Frequency:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {stats.restocks > 0 && filteredHistory.length > 0
                            ? `Every ${Math.round(filteredHistory.length / stats.restocks)} changes`
                            : 'N/A'}
                        </Typography>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2">Time Since Last Restock:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {stats.restocks > 0
                            ? (() => {
                                const lastRestock = [...filteredHistory]
                                  .filter(entry => entry.changeType === 'RESTOCK')
                                  .sort((a, b) => new Date(b.changeDate) - new Date(a.changeDate))[0];

                                if (!lastRestock) return 'N/A';

                                const days = differenceInDays(
                                  new Date(),
                                  parseISO(lastRestock.changeDate)
                                );

                                return days === 0
                                  ? 'Today'
                                  : days === 1
                                    ? 'Yesterday'
                                    : `${days} days ago`;
                              })()
                            : 'N/A'}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Stock Level Forecast
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {filteredHistory.length > 0 ? (
                      (() => {
                        const purchases = filteredHistory.filter(entry => entry.changeType === 'PURCHASE');
                        if (purchases.length < 2) {
                          return (
                            <Typography color="text.secondary">
                              Not enough purchase history to calculate forecast.
                            </Typography>
                          );
                        }

                        const sortedPurchases = [...purchases].sort(
                          (a, b) => new Date(a.changeDate) - new Date(b.changeDate)
                        );

                        const firstDate = parseISO(sortedPurchases[0].changeDate);
                        const lastDate = parseISO(sortedPurchases[sortedPurchases.length - 1].changeDate);
                        const daysDiff = differenceInDays(lastDate, firstDate) || 1;

                        const totalPurchased = purchases.reduce(
                          (sum, entry) => sum + (entry.previousQuantity - entry.newQuantity),
                          0
                        );

                        const dailyAvg = totalPurchased / daysDiff;

                        const currentQty = itemDetails.quantity;
                        const minStock = itemDetails.minStockLevel;
                        const daysUntilMin = dailyAvg > 0
                          ? Math.floor((currentQty - minStock) / dailyAvg)
                          : Infinity;

                        const daysUntilZero = dailyAvg > 0
                          ? Math.floor(currentQty / dailyAvg)
                          : Infinity;

                        return (
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Average Daily Consumption
                              </Typography>
                              <Typography variant="h6">
                                {dailyAvg.toFixed(1)} units/day
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Estimated Time to Minimum Stock
                              </Typography>
                              <Typography
                                variant="h6"
                                color={
                                  daysUntilMin <= 7
                                    ? 'error.main'
                                    : daysUntilMin <= 14
                                      ? 'warning.main'
                                      : 'success.main'
                                }
                              >
                                {daysUntilMin <= 0
                                  ? 'Below minimum stock!'
                                  : daysUntilMin === Infinity
                                    ? 'No consumption detected'
                                    : `${daysUntilMin} days`}
                              </Typography>
                            </Box>

                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Estimated Time to Stock Out
                              </Typography>
                              <Typography
                                variant="h6"
                                color={
                                  daysUntilZero <= 14
                                    ? 'error.main'
                                    : daysUntilZero <= 30
                                      ? 'warning.main'
                                      : 'success.main'
                                }
                              >
                                {daysUntilZero <= 0
                                  ? 'Stock out imminent!'
                                  : daysUntilZero === Infinity
                                    ? 'No consumption detected'
                                    : `${daysUntilZero} days`}
                              </Typography>
                            </Box>
                          </Stack>
                        );
                      })()
                    ) : (
                      <Typography color="text.secondary">
                        Insufficient data for forecast.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </Box>
  );
};

export default InventoryHistory;