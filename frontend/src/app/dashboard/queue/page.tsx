'use client';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Upload as UploadIcon, Clear as ClearIcon, Refresh as RefreshIcon } from '@mui/icons-material';

export default function QueuePage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Email Queue
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage your email queue and enqueue new emails
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Pending</Typography>
            <Typography variant="h4" fontWeight={600}>0</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Processing</Typography>
            <Typography variant="h4" fontWeight={600}>0</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Sent</Typography>
            <Typography variant="h4" fontWeight={600}>0</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Failed</Typography>
            <Typography variant="h4" fontWeight={600}>0</Typography>
          </CardContent>
        </Card>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The email queue management interface will be implemented here. Features include:
          </Typography>
          <ul>
            <li>Real-time status cards with polling every 5 seconds</li>
            <li>Current rate display (emails/minute)</li>
            <li>Enqueue form with manual and CSV upload tabs</li>
            <li>Drag & drop CSV uploader with PapaParse integration</li>
            <li>Preview first 10 rows before importing</li>
            <li>Bar chart showing status distribution</li>
            <li>Clear Failed and Retry Failed actions with confirmations</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
}
