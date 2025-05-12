import { useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const InventoryItems = ({ items, loading, error, onCreate, onUpdate, onDelete }) => {
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: 0,
    unitPrice: 0,
    minStockLevel: 0,
    alertEnabled: true,
    actionEnabled: true,
  });
  const [editItem, setEditItem] = useState(null);

  const columns = [
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'quantity', headerName: 'Quantity', width: 120 },
    {
      field: 'unitPrice',
      headerName: 'Unit Price',
      width: 120,
      valueFormatter: (params) => `$${params.value.toFixed(2)}`,
    },
    { field: 'minStockLevel', headerName: 'Min Stock', width: 120 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <>
          <IconButton
            onClick={() => {
              setEditItem(params.row);
              setOpenEditDialog(true);
            }}
            size="small"
          >
            <Edit />
          </IconButton>
          <IconButton
            onClick={() => onDelete(params.id)}
            color="error"
            size="small"
          >
            <Delete />
          </IconButton>
        </>
      ),
    },
  ];

  const rows = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    minStockLevel: item.minStockLevel,
  }));

  const handleCreate = () => {
    onCreate(newItem);
    setNewItem({
      name: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      minStockLevel: 0,
      alertEnabled: true,
      actionEnabled: true,
    });
    setOpenCreateDialog(false);
  };

  const handleUpdate = () => {
    onUpdate(editItem.id, {
      name: editItem.name,
      description: editItem.description,
      quantity: editItem.quantity,
      unitPrice: editItem.unitPrice,
      minStockLevel: editItem.minStockLevel,
    });
    setOpenEditDialog(false);
    setEditItem(null);
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontWeight="bold">
          Inventory Items
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpenCreateDialog(true)}
          startIcon={<Edit />}
        >
          Add Item
        </Button>
      </Box>
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
          No items available.
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

      {/* Create Item Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)}>
        <DialogTitle>Add New Item</DialogTitle>
        <DialogContent>
          <TextField
            label="Name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Description"
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Quantity"
            type="number"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Unit Price"
            type="number"
            value={newItem.unitPrice}
            onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Min Stock Level"
            type="number"
            value={newItem.minStockLevel}
            onChange={(e) => setNewItem({ ...newItem, minStockLevel: Number(e.target.value) })}
            fullWidth
            margin="dense"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      {editItem && (
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
          <DialogTitle>Edit Item</DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              value={editItem.name}
              onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Description"
              value={editItem.description}
              onChange={(e) => setEditItem({ ...editItem, description: e.target.value })}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Quantity"
              type="number"
              value={editItem.quantity}
              onChange={(e) => setEditItem({ ...editItem, quantity: Number(e.target.value) })}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Unit Price"
              type="number"
              value={editItem.unitPrice}
              onChange={(e) => setEditItem({ ...editItem, unitPrice: Number(e.target.value) })}
              fullWidth
              margin="dense"
            />
            <TextField
              label="Min Stock Level"
              type="number"
              value={editItem.minStockLevel}
              onChange={(e) => setEditItem({ ...editItem, minStockLevel: Number(e.target.value) })}
              fullWidth
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdate} variant="contained">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Paper>
  );
};

export default InventoryItems;