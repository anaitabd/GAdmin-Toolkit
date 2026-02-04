'use client';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function CampaignsPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Campaigns
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your email campaigns and view their performance
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create Campaign
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The campaigns table and details page will be implemented here. Features include:
          </Typography>
          <ul>
            <li>Table with name, status, sent, opens, clicks, and rates</li>
            <li>Filter by status (All, Active, Cancelled)</li>
            <li>Search by campaign name</li>
            <li>Campaign creation dialog</li>
            <li>Details page with KPI cards, timeline chart, and tabs</li>
            <li>Cancel campaign functionality</li>
            <li>Real-time polling every 10 seconds</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
}
