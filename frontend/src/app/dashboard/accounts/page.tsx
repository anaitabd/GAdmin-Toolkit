'use client';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function AccountsPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Sender Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your email sender accounts and their limits
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Account
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The sender accounts table with TanStack Table, filtering, and CRUD operations will be implemented here.
            Features include:
          </Typography>
          <ul>
            <li>Sortable table with email, provider, status, limits, and actions</li>
            <li>Status badges (active, paused, warming up, suspended)</li>
            <li>Filter by status dropdown and search by email</li>
            <li>Multi-step account creation dialog</li>
            <li>Account details modal with 30-day stats and charts</li>
            <li>Pause/Resume, Edit Limits, and Delete actions</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
}
