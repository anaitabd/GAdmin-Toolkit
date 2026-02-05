'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Copy, 
  MoreVertical,
  Eye,
  Mail,
  MousePointerClick,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { campaignsApi } from '@/lib/api/campaigns';
import { Campaign } from '@/types/models';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  draft: 'bg-gray-500',
  active: 'bg-green-500',
  paused: 'bg-yellow-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
};

export default function CampaignsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns', statusFilter],
    queryFn: () => campaignsApi.getAll(statusFilter === 'all' ? undefined : statusFilter),
    refetchInterval: 10000,
  });

  const pauseMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.pause(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign paused successfully');
    },
    onError: () => {
      toast.error('Failed to pause campaign');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.resume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign resumed successfully');
    },
    onError: () => {
      toast.error('Failed to resume campaign');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete campaign');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: number) => campaignsApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign duplicated successfully');
    },
    onError: () => {
      toast.error('Failed to duplicate campaign');
    },
  });

  const handlePauseResume = (campaign: Campaign) => {
    if (campaign.status === 'active') {
      pauseMutation.mutate(campaign.id);
    } else if (campaign.status === 'paused') {
      resumeMutation.mutate(campaign.id);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this campaign?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDuplicate = (id: number) => {
    duplicateMutation.mutate(id);
  };

  const getProgressPercentage = (campaign: Campaign) => {
    const total = campaign.stats.total_sent + campaign.stats.total_delivered;
    if (total === 0) return 0;
    return (campaign.stats.total_delivered / total) * 100;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your email campaigns and view their performance
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/campaigns/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No campaigns found</CardTitle>
            <CardDescription>
              Get started by creating your first email campaign
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard/campaigns/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {campaign.description || 'No description'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {(campaign.status === 'active' || campaign.status === 'paused') && (
                        <DropdownMenuItem onClick={() => handlePauseResume(campaign)}>
                          {campaign.status === 'active' ? (
                            <>
                              <Pause className="mr-2 h-4 w-4" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 h-4 w-4" />
                              Resume
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(campaign.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={statusColors[campaign.status]}>
                    {campaign.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{getProgressPercentage(campaign).toFixed(0)}%</span>
                  </div>
                  <Progress value={getProgressPercentage(campaign)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      Sent
                    </div>
                    <div className="text-lg font-semibold">{campaign.stats.total_sent.toLocaleString()}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      Opens
                    </div>
                    <div className="text-lg font-semibold">
                      {campaign.stats.total_opened.toLocaleString()}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({campaign.stats.open_rate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MousePointerClick className="h-3 w-3" />
                      Clicks
                    </div>
                    <div className="text-lg font-semibold">
                      {campaign.stats.total_clicked.toLocaleString()}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({campaign.stats.click_rate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="h-3 w-3" />
                      Bounces
                    </div>
                    <div className="text-lg font-semibold">
                      {campaign.stats.total_bounced.toLocaleString()}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({campaign.stats.bounce_rate.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="sm"
                    onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
