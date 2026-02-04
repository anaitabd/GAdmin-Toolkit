'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatusBadge from '@/components/common/StatusBadge';
import { SenderAccount } from '@/types/models';
import { formatNumber } from '@/lib/utils/formatters';
import { format } from 'date-fns';
import apiClient from '@/lib/api/client';

interface AccountDetailsDialogProps {
  open: boolean;
  account: SenderAccount | null;
  onClose: () => void;
}

interface AccountStats {
  total_sent: number;
  successful: number;
  failed: number;
  total_opens: number;
  total_clicks: number;
  avg_response_time: number;
}

export default function AccountDetailsDialog({
  open,
  account,
  onClose,
}: AccountDetailsDialogProps) {
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && account) {
      fetchStats();
    }
  }, [open, account]);

  const fetchStats = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/api/accounts/${account.id}/stats`);
      if (response.data.success) {
        setStats(response.data.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch account stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock timeline data for the chart
  const timelineData = [
    { date: '01/05', sent: 45, opens: 12, clicks: 3 },
    { date: '01/06', sent: 52, opens: 18, clicks: 5 },
    { date: '01/07', sent: 63, opens: 22, clicks: 7 },
    { date: '01/08', sent: 78, opens: 28, clicks: 9 },
    { date: '01/09', sent: 95, opens: 35, clicks: 12 },
    { date: '01/10', sent: 110, opens: 42, clicks: 15 },
    { date: '01/11', sent: 125, opens: 48, clicks: 18 },
  ];

  if (!account) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Account Details</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {account.email}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <StatusBadge status={account.status} />
            <Typography variant="body2" color="text.secondary">
              {account.display_name}
            </Typography>
          </Box>
        </Box>

        {/* Account Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Account Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Provider
              </Typography>
              <Typography variant="body2" textTransform="uppercase">
                {account.auth_type}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Daily Limit
              </Typography>
              <Typography variant="body2">{formatNumber(account.daily_limit)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Batch Size
              </Typography>
              <Typography variant="body2">{account.batch_size}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Send Delay
              </Typography>
              <Typography variant="body2">{account.send_delay_ms}ms</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Created
              </Typography>
              <Typography variant="body2">
                {format(new Date(account.created_at), 'MMM dd, yyyy')}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">
                Last Used
              </Typography>
              <Typography variant="body2">
                {account.last_used_at
                  ? format(new Date(account.last_used_at), 'MMM dd, yyyy')
                  : 'Never'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {/* 30-Day Stats */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : stats ? (
          <>
            <Typography variant="subtitle2" gutterBottom>
              30-Day Performance
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Total Sent
                    </Typography>
                    <Typography variant="h6">{formatNumber(Number(stats.total_sent))}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Successful
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {formatNumber(Number(stats.successful))}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Failed
                    </Typography>
                    <Typography variant="h6" color="error.main">
                      {formatNumber(Number(stats.failed))}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Opens
                    </Typography>
                    <Typography variant="h6">{formatNumber(stats.total_opens)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Clicks
                    </Typography>
                    <Typography variant="h6">{formatNumber(stats.total_clicks)}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="caption" color="text.secondary">
                      Avg Response Time
                    </Typography>
                    <Typography variant="h6">
                      {stats.avg_response_time
                        ? `${Math.round(Number(stats.avg_response_time))}ms`
                        : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Chart */}
            <Typography variant="subtitle2" gutterBottom>
              Activity Timeline
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sent" stroke="#8884d8" name="Sent" />
                <Line type="monotone" dataKey="opens" stroke="#82ca9d" name="Opens" />
                <Line type="monotone" dataKey="clicks" stroke="#ffc658" name="Clicks" />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No statistics available for this account.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
