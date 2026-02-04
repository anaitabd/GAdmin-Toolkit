'use client';
import { Box, Typography, Card, CardContent, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Add as AddIcon, Sync as SyncIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';

export default function GsuiteUsersPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            G Suite Users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Google Workspace users and bulk operations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<SyncIcon />}>
            Sync
          </Button>
          <Button variant="contained" startIcon={<PersonAddIcon />}>
            Generate Users
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>Select Domain</InputLabel>
          <Select value="" label="Select Domain">
            <MenuItem value="">No domains available</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon - Most Complex Feature
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The G Suite users management interface will be implemented here. This is the most complex feature with:
          </Typography>
          <ul>
            <li><strong>Domain selector:</strong> Dropdown that reloads table on change</li>
            <li><strong>Users table:</strong> Multi-select checkboxes, email, name, status, created date</li>
            <li><strong>Status badges:</strong> pending (grey), creating (blue spinner), active (green), failed (red with tooltip)</li>
            <li><strong>Filters:</strong> All, Pending, Active, Failed</li>
            <li><strong>Generate Users:</strong> Dialog with count and password inputs</li>
            <li><strong>Bulk Create:</strong> Async operation with progress modal</li>
            <li><strong>Bulk Delete:</strong> Confirmation + progress modal</li>
            <li><strong>Progress Modal:</strong> Live updates, percentage bar, status list, polling every 2s</li>
            <li><strong>Auto-complete detection:</strong> Closes when all users are active/failed</li>
            <li><strong>Create Sender Accounts:</strong> Converts users to sender accounts</li>
            <li><strong>Sync from Google:</strong> Fetches latest users from Google API</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
}
