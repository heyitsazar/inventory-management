import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
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
  Modal,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { toast } from 'react-toastify';

const InventoryItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: '',
    unitPrice: '',
    minStockLevel: '',
    alertEnabled: true,
    actionEnabled: true,
    autoCalculationEnabled: false,
  });
  const [editItem, setEditItem] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getAllItems();
        setItems(data);
        setError(null);
      } catch (err) {
        setError('Failed to load items.');
        toast.error('Failed to load items.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleCreate = async () => {
    try {
      const item = {
        ...newItem,
        quantity: parseInt(newItem.quantity) || 0,
        unitPrice: parseFloat(newItem.unitPrice) || 0,
        minStockLevel: parseInt(newItem.minStockLevel) || 0,
        autoCalculationEnabled: newItem.autoCalculationEnabled,
      };
      const createdItem = await inventoryService.createItem(item);
      setItems((prev) => [...prev, createdItem]);
      setNewItem({
        name: '',
        description: '',
        quantity: '',
        unitPrice: '',
        minStockLevel: '',
        alertEnabled: true,
        actionEnabled: true,
        autoCalculationEnabled: false,
      });
      toast.success('Item created successfully!');
    } catch (err) {
      toast.error('Failed to create item.');
      console.error(err);
    }
  };

  const handleEdit = (item) => {
    setEditItem({ ...item });
    setOpenModal(true);
  };

  const handleUpdate = async () => {
    try {
      const updatedItem = {
        name: editItem.name,
        description: editItem.description,
        quantity: parseInt(editItem.quantity) || 0,
        unitPrice: parseFloat(editItem.unitPrice) || 0,
        minStockLevel: parseInt(editItem.minStockLevel) || 0,
        alertEnabled: editItem.alertEnabled,
        actionEnabled: editItem.actionEnabled,
        autoCalculationEnabled: editItem.autoCalculationEnabled,
      };
      const updated = await inventoryService.updateItem(editItem.id, updatedItem);
      setItems((prev) => prev.map((item) => (item.id === editItem.id ? updated : item)));
      setOpenModal(false);
      setEditItem(null);
      toast.success('Item updated successfully!');
    } catch (err) {
      toast.error('Failed to update item.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await inventoryService.deleteItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Item deleted successfully!');
    } catch (err) {
      toast.error('Failed to delete item.');
      console.error(err);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 4, maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" mb={4}>Inventory Items</Typography>
      <Box component="form" mb={5}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Name"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              size="small"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Description"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              size="small"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={newItem.quantity}
              onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              size="small"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              label="Unit Price"
              type="number"
              value={newItem.unitPrice}
              onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
              size="small"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              label="Min Stock Level"
              type="number"
              value={newItem.minStockLevel}
              onChange={(e) => setNewItem({ ...newItem, minStockLevel: e.target.value })}
              size="small"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newItem.alertEnabled}
                    onChange={(e) => setNewItem({ ...newItem, alertEnabled: e.target.checked })}
                  />
                }
                label="Enable Alerts"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newItem.actionEnabled}
                    onChange={(e) => setNewItem({ ...newItem, actionEnabled: e.target.checked })}
                  />
                }
                label="Enable Auto Reorder" // Renamed
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newItem.autoCalculationEnabled}
                    onChange={(e) => setNewItem({ ...newItem, autoCalculationEnabled: e.target.checked })}
                  />
                }
                label="Enable Stock Optimization" // Renamed
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="contained" fullWidth onClick={handleCreate}>
              Add Item
            </Button>
          </Grid>
        </Grid>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" variant="h6" align="center">{error}</Typography>
      ) : items.length === 0 ? (
        <Typography variant="h6" align="center">No items available.</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Min Stock</TableCell>
                <TableCell>Alerts</TableCell>
                <TableCell>Auto Reorder</TableCell> {/* Renamed */}
                <TableCell>Stock Optimization</TableCell> {/* Renamed */}
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>{item.minStockLevel}</TableCell>
                  <TableCell>{item.alertEnabled ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{item.actionEnabled ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{item.autoCalculationEnabled ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="center">
                    <IconButton component={NavLink} to={`/items/${item.id}`} size="small">
                      <Visibility />
                    </IconButton>
                    <IconButton onClick={() => handleEdit(item)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item.id)} size="small" color="error">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            p: 4,
            borderRadius: 3,
            boxShadow: 24,
            width: { xs: '90%', sm: 600 },
          }}
        >
          <Typography variant="h5" fontWeight="medium" mb={3}>Edit Item</Typography>
          {editItem && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editItem.name || ''}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editItem.description || ''}
                  onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={editItem.quantity || ''}
                  onChange={(e) => setEditItem({ ...editItem, quantity: e.target.value })}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={editItem.unitPrice || ''}
                  onChange={(e) => setEditItem({ ...editItem, unitPrice: e.target.value })}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Min Stock Level"
                  type="number"
                  value={editItem.minStockLevel || ''}
                  onChange={(e) => setEditItem({ ...editItem, minStockLevel: e.target.value })}
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" flexWrap="wrap" gap={2}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editItem.alertEnabled || false}
                        onChange={(e) => setEditItem({ ...editItem, alertEnabled: e.target.checked })}
                      />
                    }
                    label="Enable Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editItem.actionEnabled || false}
                        onChange={(e) => setEditItem({ ...editItem, actionEnabled: e.target.checked })}
                      />
                    }
                    label="Enable Auto Reorder" // Renamed
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={editItem.autoCalculationEnabled || false}
                        onChange={(e) => setEditItem({ ...editItem, autoCalculationEnabled: e.target.checked })}
                      />
                    }
                    label="Enable Stock Optimization" // Renamed
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button variant="contained" color="primary" onClick={handleUpdate}>Save</Button>
                  <Button variant="outlined" color="secondary" onClick={() => setOpenModal(false)}>Cancel</Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default InventoryItems;