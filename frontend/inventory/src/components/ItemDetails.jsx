import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import inventoryService from '../services/inventoryService';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
} from '@mui/material';
import { Edit, Delete, ArrowBack } from '@mui/icons-material';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const ItemDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await inventoryService.getItemById(id);
        setItem(data);
        setEditForm(data);
        setError(null);
      } catch (err) {
        setError('Failed to load item details.');
        toast.error('Failed to load item details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const updatedItem = {
        name: editForm.name,
        description: editForm.description,
        quantity: parseInt(editForm.quantity) || 0,
        unitPrice: parseFloat(editForm.unitPrice) || 0,
        minStockLevel: parseInt(editForm.minStockLevel) || 0,
        alertEnabled: editForm.alertEnabled,
        actionEnabled: editForm.actionEnabled,
      };
      const updated = await inventoryService.updateItem(id, updatedItem);
      setItem(updated);
      setIsEditing(false);
      toast.success('Item updated successfully!');
    } catch (err) {
      toast.error('Failed to update item.');
      console.error(err);
    }
  };

  const handleDelete = async () => {
    try {
      await inventoryService.deleteItem(id);
      toast.success('Item deleted successfully!');
      navigate('/items');
    } catch (err) {
      toast.error('Failed to delete item.');
      console.error(err);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/items')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" ml={1}>Item Details</Typography>
      </Box>
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : !item ? (
        <Typography>Item not found.</Typography>
      ) : (
        <Box>
          {isEditing ? (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={editForm.unitPrice}
                  onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Min Stock Level"
                  type="number"
                  value={editForm.minStockLevel}
                  onChange={(e) => setEditForm({ ...editForm, minStockLevel: e.target.value })}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editForm.alertEnabled}
                      onChange={(e) => setEditForm({ ...editForm, alertEnabled: e.target.checked })}
                    />
                  }
                  label="Alerts"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={editForm.actionEnabled}
                      onChange={(e) => setEditForm({ ...editForm, actionEnabled: e.target.checked })}
                    />
                  }
                  label="Auto-Actions"
                />
              </Grid>
              <Grid item xs={12}>
                <Box display="flex" gap={2}>
                  <Button variant="contained" onClick={handleSave}>Save</Button>
                  <Button variant="outlined" onClick={() => setIsEditing(false)}>Cancel</Button>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Box>
              <Typography variant="h6">{item.name}</Typography>
              <Typography variant="body1" color="text.secondary" mt={1}>
                {item.description}
              </Typography>
              <Box mt={3}>
                <Typography variant="body2"><strong>Quantity:</strong> {item.quantity}</Typography>
                <Typography variant="body2"><strong>Unit Price:</strong> ${item.unitPrice.toFixed(2)}</Typography>
                <Typography variant="body2"><strong>Min Stock Level:</strong> {item.minStockLevel}</Typography>
                <Typography variant="body2"><strong>Alerts:</strong> {item.alertEnabled ? 'Enabled' : 'Disabled'}</Typography>
                <Typography variant="body2"><strong>Auto-Actions:</strong> {item.actionEnabled ? 'Enabled' : 'Disabled'}</Typography>
                <Typography variant="body2"><strong>Created:</strong> {format(new Date(item.createdAt), 'PPp')}</Typography>
                <Typography variant="body2"><strong>Updated:</strong> {format(new Date(item.updatedAt), 'PPp')}</Typography>
              </Box>
              <Box display="flex" gap={2} mt={3}>
                <Button variant="contained" startIcon={<Edit />} onClick={handleEdit}>Edit</Button>
                <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete}>Delete</Button>
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ItemDetails;