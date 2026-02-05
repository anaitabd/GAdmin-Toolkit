'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  X, 
  Copy,
  Mail,
  CheckCircle,
  Eye,
  MousePointerClick,
  AlertCircle,
  UserX,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { campaignsApi } from '@/lib/api/campaigns';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const statusColors = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
};

const emailStatusColors = {
  pending: 'secondary',
  processing: 'default',
  sent: 'outline',
  failed: 'destructive',
  bounced: 'destructive',
};

export default function CampaignDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const campaignId = parseInt(params.id);
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>('all');

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignsApi.getById(campaignId),
    refetchInterval: 10000,
  });

  const { data: emails = [] } = useQuery({
    queryKey: ['campaign-emails', campaignId, emailStatusFilter],
    queryFn: () => campaignsApi.getEmails(campaignId, emailStatusFilter === 'all' ? undefined : emailStatusFilter),
    enabled: !!campaign,
    refetchInterval: 10000,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['campaign-timeline', campaignId],
    queryFn: () => campaignsApi.getTimeline(campaignId),
    enabled: !!campaign,
  });

  const { data: topPerformers = [] } = useQuery({
    queryKey: ['campaign-top-performers', campaignId],
    queryFn: () => campaignsApi.getTopPerformers(campaignId),
    enabled: !!campaign,
  });

  const pauseMutation = useMutation({
    mutationFn: () => campaignsApi.pause(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign paused');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => campaignsApi.resume(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign resumed');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => campaignsApi.cancel(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      toast.success('Campaign cancelled');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => campaignsApi.duplicate(campaignId),
    onSuccess: () => {
      toast.success('Campaign duplicated');
      router.push('/dashboard/campaigns');
    },
  });

  if (isLoading || !campaign) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const emailStatusCounts = emails.reduce((acc, email) => {
    if (email.status === 'pending') acc.pending++;
    else if (email.status === 'processing') acc.processing++;
    else if (email.status === 'sent') acc.sent++;
    else if (email.status === 'failed' || email.status === 'bounced') acc.failed++;
    return acc;
  }, { pending: 0, processing: 0, sent: 0, failed: 0 });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/campaigns')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Campaigns
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
              <Badge variant="outline" className={statusColors[campaign.status]}>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Created {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
            </p>
            {campaign.description && (
              <p className="text-sm text-muted-foreground mt-2">{campaign.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            {campaign.status === 'active' && (
              <Button 
                variant="outline" 
                onClick={() => pauseMutation.mutate()}
                disabled={pauseMutation.isPending}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            )}
            {campaign.status === 'paused' && (
              <Button 
                variant="outline" 
                onClick={() => resumeMutation.mutate()}
                disabled={resumeMutation.isPending}
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            {(campaign.status === 'active' || campaign.status === 'paused') && (
              <Button 
                variant="outline"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this campaign?')) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => duplicateMutation.mutate()}
              disabled={duplicateMutation.isPending}
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats.total_sent.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats.total_delivered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.stats.delivery_rate.toFixed(1)}% delivery rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Opens</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats.total_opened.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.stats.open_rate.toFixed(1)}% open rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats.total_clicked.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.stats.click_rate.toFixed(1)}% click rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bounces</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats.total_bounced.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {campaign.stats.bounce_rate.toFixed(1)}% bounce rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unsubscribes</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaign.stats.total_unsubscribed.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Chart */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Campaign Timeline</CardTitle>
          <CardDescription>Track sends, opens, and clicks over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => format(new Date(date), 'MMM d')}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="sent" 
                stroke="#8884d8" 
                name="Sent"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="delivered" 
                stroke="#82ca9d" 
                name="Delivered"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="opened" 
                stroke="#ffc658" 
                name="Opens"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="clicked" 
                stroke="#ff7c7c" 
                name="Clicks"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Email Queue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Email Queue</CardTitle>
            <CardDescription>Track individual email delivery status</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">
                  All ({emails.length})
                </TabsTrigger>
                <TabsTrigger value="pending">
                  Pending ({emailStatusCounts.pending})
                </TabsTrigger>
                <TabsTrigger value="processing">
                  Processing ({emailStatusCounts.processing})
                </TabsTrigger>
                <TabsTrigger value="sent">
                  Sent ({emailStatusCounts.sent})
                </TabsTrigger>
                <TabsTrigger value="failed">
                  Failed ({emailStatusCounts.failed})
                </TabsTrigger>
              </TabsList>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Opened</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emails.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No emails found
                        </TableCell>
                      </TableRow>
                    ) : (
                      emails.slice(0, 50).map((email) => (
                        <TableRow key={email.id}>
                          <TableCell className="font-medium">{email.recipient}</TableCell>
                          <TableCell>
                            <Badge variant={emailStatusColors[email.status] as any}>
                              {email.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {email.sent_at ? format(new Date(email.sent_at), 'MMM d, HH:mm') : '-'}
                          </TableCell>
                          <TableCell>
                            {email.opened_at ? (
                              <span className="text-green-600 flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                {format(new Date(email.opened_at), 'MMM d, HH:mm')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              {emails.length > 50 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  Showing first 50 of {emails.length} emails
                </p>
              )}
            </Tabs>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Most engaged recipients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPerformers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No engagement data yet
                </p>
              ) : (
                topPerformers.slice(0, 10).map((performer, index) => (
                  <div key={performer.recipient} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[200px]">
                          {performer.recipient}
                        </p>
                        {performer.last_opened && (
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(performer.last_opened), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {performer.opens}
                        </span>
                        <span className="flex items-center gap-1">
                          <MousePointerClick className="h-3 w-3" />
                          {performer.clicks}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
