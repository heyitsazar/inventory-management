import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import InventoryHistory from './components/InventoryHistory';
import InventoryItems from './components/InventoryItems';
import SupplierOrders from './components/SupplierOrders';
import PurchasedItems from './components/PurchasedItems';
import ItemDetails from './components/ItemDetails';
import { ToastContainer } from 'react-toastify';
import { Refresh, Inventory, History, ShoppingBag, LocalShipping, Home } from '@mui/icons-material';
import 'react-toastify/dist/ReactToastify.css';
import logo from '/icon.png';
import { AppBar, Toolbar, Typography, IconButton, Box, Drawer, CssBaseline, createTheme, ThemeProvider } from '@mui/material';

// Modern Theme
const theme = createTheme({
  palette: {
    primary: { main: '#1e40af' },
    secondary: { main: '#60a5fa' },
    background: { default: '#f8fafc', paper: '#ffffff' },
    text: { primary: '#1f2937', secondary: '#6b7280' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          padding: '8px 16px',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, backgroundColor: '#f1f5f9' },
        body: { padding: '12px' },
      },
    },
  },
});

// Sidebar Navigation
const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', icon: <Home fontSize="small" />, label: 'Dashboard' },
    { path: '/history', icon: <History fontSize="small" />, label: 'History' },
    { path: '/items', icon: <Inventory fontSize="small" />, label: 'Items' },
    { path: '/orders', icon: <LocalShipping fontSize="small" />, label: 'Orders' },
    { path: '/purchased', icon: <ShoppingBag fontSize="small" />, label: 'Purchased' },
  ];

  return (
    <Box
      sx={{
        width: 240,
        flexShrink: 0,
        position: 'fixed',
        left: 0,
        top: 64, // Below the AppBar
        bottom: 0,
        bgcolor: 'background.paper',
        boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Navigation items */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Box component="nav">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  mx: 1,
                  borderRadius: 2,
                  bgcolor: location.pathname === item.path ? 'primary.light' : 'transparent',
                  color: location.pathname === item.path ? 'primary.main' : 'text.primary',
                  '&:hover': { bgcolor: 'secondary.light', color: 'primary.main' },
                  transition: 'all 0.2s',
                }}
              >
                {item.icon}
                <Typography variant="body1" fontWeight={500}>{item.label}</Typography>
              </Box>
            </NavLink>
          ))}
        </Box>
      </Box>

      {/* Footer navigation inside sidebar */}
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          p: 2,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Quick Links</Typography>
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
          <Box component="li" sx={{ mb: 1 }}>
            <NavLink to="/items" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontSize: '0.875rem' }}>
              All Items
            </NavLink>
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            <NavLink to="/history" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontSize: '0.875rem' }}>
              History
            </NavLink>
          </Box>
          <Box component="li" sx={{ mb: 1 }}>
            <a href="#" style={{ color: 'white', opacity: 0.8, textDecoration: 'none', fontSize: '0.875rem' }}>Support</a>
          </Box>
        </Box>
        <Typography variant="caption" sx={{ display: 'block', mt: 2, textAlign: 'center', opacity: 0.7 }}>
          © 2025 Flow Inventory Management
        </Typography>
      </Box>
    </Box>
  );
};

function App() {
  const handleRefresh = () => {
    window.location.reload(); // Simple refresh to trigger component data fetching
  };

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <CssBaseline />
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          {/* Header */}
          <AppBar position="fixed" sx={{ bgcolor: 'primary.main', boxShadow: 2, zIndex: 1200 }}>
            <Toolbar sx={{ maxWidth: 1280, mx: 'auto', width: '100%', px: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <img src={logo} alt="Inventory Logo" style={{ height: 40, width: 40 }} />
                <Box>
                  <Typography variant="h5">Flow Inventory Management</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    Smart Stock Solutions
                  </Typography>
                </Box>
              </Box>
              <Box flexGrow={1} />
              <IconButton
                onClick={handleRefresh}
                sx={{
                  bgcolor: 'secondary.main',
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'secondary.dark' },
                }}
                title="Refresh Data"
              >
                <Refresh />
              </IconButton>
            </Toolbar>
          </AppBar>

          {/* Sidebar with integrated footer */}
          <Sidebar />

          {/* Main Content */}
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: { xs: 2, sm: 3 },
              mt: '64px', // Space for AppBar
              ml: { xs: 0, md: '240px' }, // Space for sidebar on medium and larger screens
              width: { xs: '100%', md: 'calc(100% - 240px)' },
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ flexGrow: 1, maxWidth: 1280, mx: 'auto', width: '100%', pb: 4 }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/history" element={<InventoryHistory />} />
                <Route path="/history/:id/range" element={<InventoryHistory />} />
                <Route path="/items" element={<InventoryItems />} />
                <Route path="/items/:id" element={<ItemDetails />} />
                <Route path="/orders" element={<SupplierOrders />} />
                <Route path="/purchased" element={<PurchasedItems />} />
              </Routes>
            </Box>
          </Box>

          {/* Main footer - only visible on mobile when sidebar is hidden */}
          <Box
            component="footer"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              py: 3,
              px: { xs: 2, sm: 3 },
              display: { xs: 'block', md: 'none' }, // Only show on small screens
              mt: 'auto',
            }}
          >
            <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography variant="h6" mb={1}>Flow Inventory Management</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mb: 2 }}>
                  Smart Stock Solutions
                </Typography>
                <Box display="flex" justifyContent="center" gap={2} mb={2}>
                  <NavLink to="/items" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Items</NavLink>
                  <NavLink to="/history" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>History</NavLink>
                  <NavLink to="/orders" style={{ color: 'white', opacity: 0.8, textDecoration: 'none' }}>Orders</NavLink>
                </Box>
                <Typography variant="body2" align="center" sx={{ opacity: 0.8 }}>
                  © 2025 Flow Inventory Management. All rights reserved.
                </Typography>
              </Box>
            </Box>
          </Box>

          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;