'use client';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export default function GsuiteDomainsPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            G Suite Domains
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage Google Workspace domains and service accounts
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Domain
        </Button>
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Coming Soon
          </Typography>
          <Typography variant="body2" color="text.secondary">
            The G Suite domains management interface will be implemented here. Features include:
          </Typography>
          <ul>
            <li>Table with domain, customer ID, admin email, status, verified, users count</li>
            <li>Status badges (active/suspended/deleted)</li>
            <li>Add domain dialog with form validation</li>
            <li>Upload service account dialog (drag & drop .json file)</li>
            <li>JSON validation for required keys</li>
            <li>Test authentication button</li>
            <li>View users and sync functionality</li>
            <li>Delete domain with confirmation</li>
          </ul>
        </CardContent>
      </Card>
    </Box>
  );
}
