'use client';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  }, [open, account?.id]);

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
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">{account.email}</h3>
            <div className="flex gap-3 items-center mt-2">
              <StatusBadge status={account.status} />
              <span className="text-sm text-muted-foreground">{account.display_name}</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Account Information</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Provider</p>
                <p className="text-sm uppercase font-medium">{account.auth_type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Limit</p>
                <p className="text-sm font-medium">{formatNumber(account.daily_limit)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Batch Size</p>
                <p className="text-sm font-medium">{account.batch_size}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Send Delay</p>
                <p className="text-sm font-medium">{account.send_delay_ms}ms</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(account.created_at), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Used</p>
                <p className="text-sm font-medium">
                  {account.last_used_at
                    ? format(new Date(account.last_used_at), 'MMM dd, yyyy')
                    : 'Never'}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : stats ? (
            <>
              <div>
                <h4 className="text-sm font-semibold mb-3">30-Day Performance</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Total Sent</p>
                      <p className="text-2xl font-bold">{formatNumber(Number(stats.total_sent))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Successful</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatNumber(Number(stats.successful))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatNumber(Number(stats.failed))}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Opens</p>
                      <p className="text-2xl font-bold">{formatNumber(Number(stats.total_opens))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Clicks</p>
                      <p className="text-2xl font-bold">{formatNumber(Number(stats.total_clicks))}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-xs text-muted-foreground">Avg Response Time</p>
                      <p className="text-2xl font-bold">
                        {stats.avg_response_time
                          ? `${Math.round(Number(stats.avg_response_time))}ms`
                          : 'N/A'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold mb-3">Activity Timeline</h4>
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
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No statistics available for this account.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
