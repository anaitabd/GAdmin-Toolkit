'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workersApi, WorkerStatus } from '@/lib/api/workers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Play,
  StopCircle,
  RotateCw,
  FileText,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WorkersPage() {
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Fetch workers list
  const { data: workers, isLoading, refetch } = useQuery({
    queryKey: ['workers'],
    queryFn: workersApi.getWorkers,
    refetchInterval: refreshInterval,
  });

  // Fetch global metrics
  const { data: metrics } = useQuery({
    queryKey: ['worker-metrics'],
    queryFn: workersApi.getWorkerMetrics,
    refetchInterval: refreshInterval,
  });

  const handleStartWorker = async (accountId: number) => {
    try {
      await workersApi.startWorker(accountId);
      toast.success('Worker started successfully');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start worker');
    }
  };

  const handleStopWorker = async (accountId: number) => {
    try {
      await workersApi.stopWorker(accountId);
      toast.success('Worker stopped successfully');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to stop worker');
    }
  };

  const handleRestartWorker = async (accountId: number) => {
    try {
      await workersApi.restartWorker(accountId);
      toast.success('Worker restarted successfully');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restart worker');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: any }> = {
      running: { variant: 'default', icon: CheckCircle2 },
      idle: { variant: 'secondary', icon: Activity },
      error: { variant: 'destructive', icon: AlertCircle },
      stopping: { variant: 'outline', icon: StopCircle },
      not_running: { variant: 'outline', icon: StopCircle },
      unknown: { variant: 'outline', icon: Activity },
    };

    const config = statusMap[status] || statusMap.unknown;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatUptime = (uptime: number | null) => {
    if (!uptime) return 'N/A';
    
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workers Management</h1>
        <p className="text-muted-foreground mt-1">
          Monitor and manage email sending workers
        </p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.orchestrator?.totalWorkers || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.orchestrator?.runningWorkers || 0} running
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Emails/Second</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.lastHour.emailsPerSecond.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Last hour average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.lastHour.totalSent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.lastHour.successful.toLocaleString()} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.lastHour.errorRate.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.lastHour.failed + metrics.lastHour.bounced} failures
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Workers</CardTitle>
          <CardDescription>
            Monitor status and control email sending workers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading workers...</div>
          ) : !workers || workers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active workers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Process</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Daily Sent</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workers.map((worker) => (
                  <TableRow key={worker.accountId}>
                    <TableCell className="font-medium">{worker.email}</TableCell>
                    <TableCell>
                      <Badge variant={
                        worker.accountStatus === 'active' ? 'default' :
                        worker.accountStatus === 'warming_up' ? 'secondary' :
                        'outline'
                      }>
                        {worker.accountStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(worker.processStatus)}</TableCell>
                    <TableCell>{formatUptime(worker.uptime)}</TableCell>
                    <TableCell>
                      {worker.dailySent} / {worker.dailyLimit}
                    </TableCell>
                    <TableCell>
                      {worker.lastHeartbeat
                        ? new Date(worker.lastHeartbeat).toLocaleTimeString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {worker.processStatus === 'running' ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRestartWorker(worker.accountId)}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStopWorker(worker.accountId)}
                            >
                              <StopCircle className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartWorker(worker.accountId)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            toast.info('Logs feature coming soon');
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
