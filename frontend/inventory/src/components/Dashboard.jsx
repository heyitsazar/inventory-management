import { useState, useEffect, useMemo, useCallback } from 'react';
import inventoryService from '../services/inventoryService';
import { 
  Box, Typography, Grid, Paper, CircularProgress, Chip, Card, CardContent, 
  Button, IconButton, Divider, Tab, Tabs, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, useTheme, Tooltip, Alert,
  LinearProgress, alpha
} from '@mui/material';
import { 
  Bar, Pie, Line, Doughnut 
} from 'react-chartjs-2';
import { 
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, 
  Title, Tooltip as ChartTooltip, Legend, PointElement, LineElement, 
  RadialLinearScale, TimeScale, Filler
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { toast } from 'react-toastify';
import { 
  TrendingUp, TrendingDown, WarningAmber, CheckCircle, 
  Refresh, Inventory, ShoppingCart, Timeline, DonutLarge,
  ArrowUpward, ArrowDownward
} from '@mui/icons-material';

ChartJS.register(
  ArcElement, BarElement, CategoryScale, LinearScale, PointElement, 
  LineElement, Title, ChartTooltip, Legend, RadialLinearScale, 
  TimeScale, Filler
);

const Dashboard = () => {
  const theme = useTheme();
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [nearMinimumItems, setNearMinimumItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [timeframe, setTimeframe] = useState('week');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
   
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsData, ordersData, nearMinimumData] = await Promise.all([
          inventoryService.getAllItems(),
          inventoryService.getAllOrders(),
          inventoryService.getItemsNearMinimum(),
        ]);
        setItems(itemsData);
        setOrders(ordersData);
        setNearMinimumItems(nearMinimumData);
        setError(null);
        if (refreshTrigger > 0) {
         
        }
      } catch (err) {
        setError('Failed to load dashboard data.');
        toast.error('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshTrigger]);

  // Calculate trend indicators
  const trends = useMemo(() => {
    // These would normally come from historical data, using mock values for demonstration
    return {
      stockTrend: 0.05, // 5% increase
      ordersTrend: 0.12, // 12% increase
      lowStockTrend: -0.03, // 3% decrease (good!)
    };
  }, []);

  // Stock Levels Chart (Enhanced Bar Chart)
  const stockLevelData = useMemo(() => {
    if (!items.length) return null;
    
    // Sort items by quantity for better visualization
    const sortedItems = [...items].sort((a, b) => b.quantity - a.quantity);
    const top10Items = sortedItems.slice(0, 10); // Show only top 10 for readability
    
    return {
      labels: top10Items.map(item => item.name),
      datasets: [
        {
          label: 'Current Stock',
          data: top10Items.map(item => item.quantity),
          backgroundColor: top10Items.map(item => 
            item.quantity <= item.minStockLevel 
              ? theme.palette.error.main 
              : item.quantity <= item.minStockLevel * 1.2 
                ? theme.palette.warning.main 
                : theme.palette.primary.main
          ),
          borderColor: 'rgba(0,0,0,0.1)',
          borderWidth: 1,
          borderRadius: 4,
          barThickness: 20,
        },
        {
          label: 'Minimum Level',
          data: top10Items.map(item => item.minStockLevel),
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderColor: theme.palette.divider,
          borderWidth: 1,
          borderDash: [5, 5],
          type: 'line',
        },
      ],
    };
  }, [items, theme]);

  // Stock Status (Enhanced Doughnut)
  const stockStatusData = useMemo(() => {
    if (!items.length) return null;
    
    const lowStock = nearMinimumItems.length;
    const sufficientStock = items.length - lowStock;
    const criticalStock = items.filter(item => item.quantity <= item.minStockLevel * 0.5).length;
    
    return {
      labels: ['Critical Stock', 'Low Stock', 'Sufficient Stock'],
      datasets: [{
        data: [criticalStock, lowStock - criticalStock, sufficientStock],
        backgroundColor: [
          theme.palette.error.dark,
          theme.palette.warning.main,
          theme.palette.success.main,
        ],
        borderColor: [
          theme.palette.error.dark,
          theme.palette.warning.dark,
          theme.palette.success.dark,
        ],
        borderWidth: 1,
        hoverOffset: 5,
      }],
    };
  }, [items, nearMinimumItems, theme]);

  // Order Trend (Line Chart)
  const orderTrendData = useMemo(() => {
    if (!orders.length) return null;
    
    // Group orders by date
    const ordersByDate = {};
    const now = new Date();
    let daysToInclude = 7;
    
    if (timeframe === 'month') {
      daysToInclude = 30;
    } else if (timeframe === 'quarter') {
      daysToInclude = 90;
    }
    
    // Initialize all dates with 0 to ensure complete timeline
    for (let i = 0; i < daysToInclude; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (daysToInclude - i - 1));
      const dateStr = date.toISOString().split('T')[0];
      ordersByDate[dateStr] = 0;
    }
    
    // Populate with actual data
    orders.forEach(order => {
      const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
      // Only include orders within our timeframe
      const orderTime = new Date(orderDate).getTime();
      const startTime = new Date(now);
      startTime.setDate(startTime.getDate() - daysToInclude);
      
      if (orderTime >= startTime.getTime()) {
        if (ordersByDate[orderDate] !== undefined) {
          ordersByDate[orderDate] += order.quantity;
        }
      }
    });
    
    // Convert to arrays for the chart
    const dates = Object.keys(ordersByDate);
    const quantities = Object.values(ordersByDate);
    
    return {
      labels: dates,
      datasets: [{
        label: 'Order Quantities',
        data: quantities,
        fill: true,
        backgroundColor: `rgba(${theme.palette.primary.light.replace(/[^\d,]/g, '')}, 0.2)`,
        borderColor: theme.palette.primary.main,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
      }],
    };
  }, [orders, timeframe, theme]);

  // Category Distribution (for pie chart)
  const categoryData = useMemo(() => {
    // This would typically come from your API with real categories
    // Using mock data for demonstration
    if (!items.length) return null;
    
    const categories = {
      'Electronics': items.filter((_, i) => i % 5 === 0).length,
      'Clothing': items.filter((_, i) => i % 5 === 1).length,
      'Food': items.filter((_, i) => i % 5 === 2).length,
      'Household': items.filter((_, i) => i % 5 === 3).length,
      'Other': items.filter((_, i) => i % 5 === 4).length,
    };
    
    return {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.info.main,
          theme.palette.success.main,
          theme.palette.warning.main,
        ],
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      }],
    };
  }, [items, theme]);

  // Aggregated stats with additional metrics
  const stats = useMemo(() => {
    if (!items.length || !orders.length) return null;
    
    // Calculate total inventory value
    const totalValue = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    
    // Calculate average order value
    const totalOrderValue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const avgOrderValue = orders.length ? totalOrderValue / orders.length : 0;
    
    // Calculate restock efficiency - % of items restocked before hitting minimum
    const restockOrders = orders.filter(order => 
      order.status === 'COMPLETED' && 
      items.find(item => item.id === order.item.id)?.quantity > 
      items.find(item => item.id === order.item.id)?.minStockLevel
    );
    const restockEfficiency = orders.length ? (restockOrders.length / orders.length) * 100 : 0;
    
    return {
      totalItems: items.length,
      totalOrders: orders.length,
      nearMinimum: nearMinimumItems.length,
      totalValue: totalValue.toFixed(2),
      avgOrderValue: avgOrderValue.toFixed(2),
      restockEfficiency: restockEfficiency.toFixed(1),
      recentOrders: orders
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5)
        .map((order) => ({
          id: order.id,
          item: order.item.name,
          quantity: order.quantity,
          totalPrice: order.totalPrice,
          status: order.status,
          date: new Date(order.orderDate).toLocaleDateString(),
        })),
      criticalItems: nearMinimumItems
        .filter(item => item.quantity <= item.minStockLevel)
        .sort((a, b) => (a.quantity / a.minStockLevel) - (b.quantity / b.minStockLevel))
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          name: item.name,
          current: item.quantity,
          minimum: item.minStockLevel,
          percentage: Math.round((item.quantity / item.minStockLevel) * 100),
        })),
    };
  }, [items, orders, nearMinimumItems]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 10,
        boxPadding: 5,
        usePointStyle: true,
        bodyFont: {
          family: theme.typography.fontFamily,
        },
        titleFont: {
          family: theme.typography.fontFamily,
          weight: 'bold',
        },
      },
    },
  };

  // Stock Level Chart Options
  const stockLevelOptions = {
    ...chartOptions,
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
          borderDash: [2, 5],
        },
        beginAtZero: true,
      },
    },
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: 'Top 10 Items by Stock Level',
        font: {
          size: 16,
        },
      },
    },
  };

  // Order Trend Options
  const orderTrendOptions = {
    ...chartOptions,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: timeframe === 'week' ? 'day' : timeframe === 'month' ? 'week' : 'month',
          tooltipFormat: 'PP',
          displayFormats: {
            day: 'MMM d',
            week: 'MMM d',
            month: 'MMM yyyy',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
          borderDash: [2, 5],
        },
        beginAtZero: true,
      },
    },
    plugins: {
      ...chartOptions.plugins,
      title: {
        display: true,
        text: `Order Quantities (Last ${timeframe === 'week' ? 'Week' : timeframe === 'month' ? 'Month' : 'Quarter'})`,
        font: {
          size: 16,
        },
      },
    },
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  // Loading state UI
  if (loading) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3, height: '80vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: 'text.secondary' }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  // Error state UI
  if (error) {
    return (
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={refreshData}
          startIcon={<Refresh />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: { xs: 2, md: 3 } }}>
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Typography variant="h5" fontWeight="bold">Inventory Dashboard</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            icon={<CheckCircle fontSize="small" />} 
            label="Live Data" 
            color="success" 
            size="small" 
            variant="outlined" 
          />
          <Button 
            variant="outlined" 
            size="small" 
            startIcon={<Refresh />} 
            onClick={refreshData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Total Items Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="500">Total Items</Typography>
                <Inventory sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>{stats?.totalItems || 0}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trends.stockTrend > 0 ? 
                  <ArrowUpward fontSize="small" /> : 
                  <ArrowDownward fontSize="small" />
                }
                <Typography variant="body2">
                  {Math.abs(trends.stockTrend * 100).toFixed(1)}% {trends.stockTrend > 0 ? 'increase' : 'decrease'} from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Orders Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ bgcolor: theme.palette.secondary.light, color: theme.palette.secondary.contrastText, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="500">Total Orders</Typography>
                <ShoppingCart sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>{stats?.totalOrders || 0}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trends.ordersTrend > 0 ? 
                  <ArrowUpward fontSize="small" /> : 
                  <ArrowDownward fontSize="small" />
                }
                <Typography variant="body2">
                  {Math.abs(trends.ordersTrend * 100).toFixed(1)}% {trends.ordersTrend > 0 ? 'increase' : 'decrease'} from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ bgcolor: theme.palette.warning.light, color: theme.palette.warning.contrastText, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="500">Low Stock Items</Typography>
                <WarningAmber sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>{stats?.nearMinimum || 0}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {trends.lowStockTrend < 0 ? 
                  <ArrowDownward fontSize="small" /> : 
                  <ArrowUpward fontSize="small" />
                }
                <Typography variant="body2">
                  {Math.abs(trends.lowStockTrend * 100).toFixed(1)}% {trends.lowStockTrend < 0 ? 'decrease' : 'increase'} from last month
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Inventory Value Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={0} sx={{ bgcolor: theme.palette.success.light, color: theme.palette.success.contrastText, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight="500">Total Value</Typography>
                <DonutLarge sx={{ fontSize: 40, opacity: 0.3 }} />
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>${stats?.totalValue || '0.00'}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp fontSize="small" />
                <Typography variant="body2">
                  Avg. Order: ${stats?.avgOrderValue || '0.00'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dashboard Tabs */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Overview" icon={<DonutLarge />} iconPosition="start" />
        <Tab label="Stock Analysis" icon={<Inventory />} iconPosition="start" />
        <Tab label="Order Trends" icon={<Timeline />} iconPosition="start" />
      </Tabs>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Stock Level Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Stock Levels</Typography>
              {stockLevelData && (
                <Box sx={{ height: 330 }}>
                  <Bar data={stockLevelData} options={stockLevelOptions} />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Stock Status Chart */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Stock Status</Typography>
              {stockStatusData && (
                <Box sx={{ height: 330, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <Doughnut data={stockStatusData} options={chartOptions} />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Critical Items */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Critical Items</Typography>
              {stats?.criticalItems?.length ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Current</TableCell>
                        <TableCell align="right">Minimum</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.criticalItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Tooltip title={item.name} arrow>
                              <Typography noWrap sx={{ maxWidth: 150 }}>{item.name}</Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">{item.current}</TableCell>
                          <TableCell align="right">{item.minimum}</TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              label={`${item.percentage}%`}
                              color={item.percentage < 50 ? 'error' : item.percentage < 80 ? 'warning' : 'success'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="success">No critical items at the moment!</Alert>
              )}
            </Paper>
          </Grid>

          {/* Recent Orders */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Recent Orders</Typography>
              {stats?.recentOrders?.length ? (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Order #</TableCell>
                        <TableCell>Item</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.id}</TableCell>
                          <TableCell>
                            <Tooltip title={order.item} arrow>
                              <Typography noWrap sx={{ maxWidth: 120 }}>{order.item}</Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="right">{order.quantity}</TableCell>
                          <TableCell align="right">${order.totalPrice.toFixed(2)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              size="small"
                              label={order.status}
                              color={order.status === 'COMPLETED' ? 'success' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">No recent orders found.</Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Grid container spacing={3}>
          {/* Stock Distribution by Category */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Inventory by Category</Typography>
              {categoryData && (
                <Box sx={{ height: 330, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <Pie data={categoryData} options={chartOptions} />
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Inventory Metrics */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 400 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Inventory Metrics</Typography>
              <Box sx={{ height: 330, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">Restock Efficiency</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(stats?.restockEfficiency || 0)}
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: parseFloat(stats?.restockEfficiency || 0) > 75 
                              ? theme.palette.success.main 
                              : parseFloat(stats?.restockEfficiency || 0) > 50 
                                ? theme.palette.warning.main 
                                : theme.palette.error.main
                          }
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="textSecondary">{stats?.restockEfficiency || 0}%</Typography>
                  </Box>
                </Box>
                
                <Divider />
                
                <Box sx={{ my: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                        <Typography variant="subtitle2" color="textSecondary">Avg. Order Value</Typography>
                        <Typography variant="h5" fontWeight="bold">${stats?.avgOrderValue || '0.00'}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper elevation={0} sx={{ p: 2, backgroundColor: theme.palette.grey[50] }}>
                        <Typography variant="subtitle2" color="textSecondary">Items per Order</Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {stats?.totalOrders ? (orders.reduce((sum, order) => sum + order.quantity, 0) / stats.totalOrders).toFixed(1) : '0.0'}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
                
                <Divider />
                
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">Stock Health Score</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                    {/* Circular progress indicator for stock health */}
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                      <CircularProgress
                        variant="determinate"
                        value={items.length ? 100 - (nearMinimumItems.length / items.length * 100) : 0}
                        size={80}
                        thickness={8}
                        sx={{ 
                          color: nearMinimumItems.length / items.length < 0.1 
                            ? theme.palette.success.main 
                            : nearMinimumItems.length / items.length < 0.2 
                              ? theme.palette.warning.main 
                              : theme.palette.error.main 
                        }}
                      />
                      <Box
                        sx={{
                          top: 0,
                          left: 0,
                          bottom: 0,
                          right: 0,
                          position: 'absolute',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="div"
                          color="text.secondary"
                        >
                          {items.length ? Math.round(100 - (nearMinimumItems.length / items.length * 100)) : 0}%
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          {/* Stock Level Details */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Stock Level Details</Typography>
              <TableContainer sx={{ maxHeight: 400 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Current Stock</TableCell>
                      <TableCell align="right">Min Level</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow 
                        key={item.id}
                        sx={{ 
                          backgroundColor: item.quantity <= item.minStockLevel * 0.5 
                            ? alpha(theme.palette.error.light, 0.2)
                            : item.quantity <= item.minStockLevel 
                              ? alpha(theme.palette.warning.light, 0.2)
                              : 'inherit'
                        }}
                      >
                        <TableCell>
                          <Typography fontWeight={item.quantity <= item.minStockLevel ? "bold" : "normal"}>
                            {item.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={item.description} arrow>
                            <Typography noWrap sx={{ maxWidth: 200 }}>{item.description}</Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{item.minStockLevel}</TableCell>
                        <TableCell align="right">
                          <Chip
                            size="small"
                            label={
                              item.quantity <= item.minStockLevel * 0.5 
                                ? "Critical" 
                                : item.quantity <= item.minStockLevel 
                                  ? "Low" 
                                  : "OK"
                            }
                            color={
                              item.quantity <= item.minStockLevel * 0.5 
                                ? "error" 
                                : item.quantity <= item.minStockLevel 
                                  ? "warning" 
                                  : "success"
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          {/* Order Trend Chart */}
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="500">Order Trend</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant={timeframe === 'week' ? 'contained' : 'outlined'}
                    onClick={() => handleTimeframeChange('week')}
                  >
                    Week
                  </Button>
                  <Button 
                    size="small" 
                    variant={timeframe === 'month' ? 'contained' : 'outlined'}
                    onClick={() => handleTimeframeChange('month')}
                  >
                    Month
                  </Button>
                  <Button 
                    size="small" 
                    variant={timeframe === 'quarter' ? 'contained' : 'outlined'}
                    onClick={() => handleTimeframeChange('quarter')}
                  >
                    Quarter
                  </Button>
                </Box>
              </Box>
              <Box sx={{ height: 400 }}>
                {orderTrendData ? (
                  <Line data={orderTrendData} options={orderTrendOptions} />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography color="textSecondary">No order data available for the selected timeframe</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Order Statistics Cards */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Order Value Stats</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Total Order Value</Typography>
                <Typography variant="h4" fontWeight="bold" color="primary">
                  ${orders.reduce((sum, order) => sum + order.totalPrice, 0).toFixed(2)}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">Average Order Value</Typography>
                <Typography variant="h4" fontWeight="bold" color="secondary">
                  ${stats?.avgOrderValue || '0.00'}
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Largest Order</Typography>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  ${Math.max(...orders.map(order => order.totalPrice), 0).toFixed(2)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Order Status */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Order Status</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}>
                {/* Create a status breakdown chart */}
                {(() => {
                  const statusData = {
                    labels: ['Completed', 'Pending', 'Processing', 'Cancelled'],
                    datasets: [{
                      data: [
                        orders.filter(order => order.status === 'COMPLETED').length,
                        orders.filter(order => order.status === 'PENDING').length || 5, // Mock data if needed
                        orders.filter(order => order.status === 'PROCESSING').length || 3, // Mock data if needed
                        orders.filter(order => order.status === 'CANCELLED').length || 1, // Mock data if needed
                      ],
                      backgroundColor: [
                        theme.palette.success.main,
                        theme.palette.warning.main,
                        theme.palette.info.main,
                        theme.palette.error.main,
                      ],
                      borderWidth: 0,
                    }],
                  };
                  return <Pie data={statusData} options={chartOptions} />;
                })()}
              </Box>
              <Box sx={{ mt: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {orders.filter(order => order.status === 'COMPLETED').length} orders completed successfully this period.
                </Alert>
              </Box>
            </Paper>
          </Grid>

          {/* Top Ordered Items */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" fontWeight="500" sx={{ mb: 2 }}>Top Ordered Items</Typography>
              {/* Group orders by item and calculate total quantities */}
              {(() => {
                // Group by item.id
                const groupedOrders = {};
                orders.forEach(order => {
                  const itemId = order.item.id;
                  if (!groupedOrders[itemId]) {
                    groupedOrders[itemId] = {
                      item: order.item,
                      totalQuantity: 0,
                      totalValue: 0,
                      orderCount: 0,
                    };
                  }
                  groupedOrders[itemId].totalQuantity += order.quantity;
                  groupedOrders[itemId].totalValue += order.totalPrice;
                  groupedOrders[itemId].orderCount += 1;
                });

                // Convert to array and sort
                const sortedItems = Object.values(groupedOrders)
                  .sort((a, b) => b.totalQuantity - a.totalQuantity)
                  .slice(0, 5);

                return (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Orders</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedItems.length > 0 ? (
                          sortedItems.map((item) => (
                            <TableRow key={item.item.id}>
                              <TableCell>
                                <Tooltip title={item.item.name} arrow>
                                  <Typography noWrap sx={{ maxWidth: 120 }}>{item.item.name}</Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell align="right">{item.totalQuantity}</TableCell>
                              <TableCell align="right">{item.orderCount}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} align="center">No order data available</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                );
              })()}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;