import { DataGrid } from '@mui/x-data-grid';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';

const InventoryHistory = ({ history, loading, error }) => {
  const columns = [
    { field: 'itemName', headerName: 'Item Name', width: 200, valueGetter: (params) => params.row.item.name },
    { field: 'changeType', headerName: 'Change Type', width: 150 },
    { field: 'previousQuantity', headerName: 'Previous Quantity', width: 150 },
    { field: 'newQuantity', headerName: 'New Quantity', width: 150 },
    {
      field: 'changeDate',
      headerName: 'Change Date',
      width: 200,
      valueFormatter: (params) => new Date(params.value).toLocaleString(),
    },
  ];

  const rows = history.map((entry) => ({
    id: entry.id,
    item: entry.item,
    changeType: entry.changeType,
    previousQuantity: entry.previousQuantity,
    newQuantity: entry.newQuantity,
    changeDate: entry.changeDate,
  }));

  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Inventory History
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
          No history available.
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

export default InventoryHistory;