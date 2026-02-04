'use client';
import { Box, Typography, Card, CardContent, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

export default function AnalyticsPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View detailed analytics and performance metrics
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Period</InputLabel>
          <Select value="7" label="Period">
            <MenuItem value="7">Last 7 days</MenuItem>
            <MenuItem value="30">Last 30 days</MenuItem>
            <MenuItem value="90">Last 90 days</MenuItem>
            <MenuItem value="custom">Custom range</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The analytics dashboard will be implemented here. Features include:
          </Typography>
          <ul>
            <li>Period selector (7/30/90 days + custom date range)</li>
            <li>KPI cards: Sent, Delivered, Opens, Clicks, Bounces + Rates</li>
            <li>Multi-line chart showing daily metrics (Recharts)</li>
            <li>Donut chart for status distribution</li>
            <li>Bar chart for top 5 campaigns by opens</li>
            <li>Sortable campaigns metrics table</li>
            <li>Export to CSV functionality</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
}
