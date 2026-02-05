'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingDomainsApi, TrackingDomain } from '@/lib/api/trackingDomains';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, RefreshCw, Trash2, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function TrackingDomainsPage() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newDomain, setNewDomain] = useState({
    domain: '',
    provider: 'aws_route53',
    hostedZoneId: '',
  });

  // Fetch tracking domains
  const { data: domains, isLoading } = useQuery({
    queryKey: ['tracking-domains'],
    queryFn: () => trackingDomainsApi.getTrackingDomains(),
  });

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: () =>
      trackingDomainsApi.addTrackingDomain(
        newDomain.domain,
        newDomain.provider,
        newDomain.hostedZoneId || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-domains'] });
      setIsAddDialogOpen(false);
      setNewDomain({ domain: '', provider: 'aws_route53', hostedZoneId: '' });
      toast.success('Tracking domain added successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to add domain');
    },
  });

  // Delete domain mutation
  const deleteDomainMutation = useMutation({
    mutationFn: (id: number) => trackingDomainsApi.deleteTrackingDomain(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracking-domains'] });
      toast.success('Tracking domain deleted successfully');
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to delete domain');
    },
  });

  // Verify domain mutation
  const verifyDomainMutation = useMutation({
    mutationFn: (id: number) => trackingDomainsApi.verifyTrackingDomain(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tracking-domains'] });
      if (data.verified) {
        toast.success('Domain verified successfully');
      } else {
        toast.warning('Domain verification failed. DNS may not be propagated yet.');
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to verify domain');
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
      available: { variant: 'secondary', icon: CheckCircle2, label: 'Available' },
      assigned: { variant: 'default', icon: CheckCircle2, label: 'Assigned' },
      dns_pending: { variant: 'outline', icon: Clock, label: 'DNS Pending' },
      active: { variant: 'default', icon: CheckCircle2, label: 'Active' },
      failed: { variant: 'destructive', icon: XCircle, label: 'Failed' },
    };

    const config = statusConfig[status] || { variant: 'outline', icon: AlertCircle, label: status };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const handleAddDomain = () => {
    if (!newDomain.domain) {
      toast.error('Please enter a domain name');
      return;
    }
    addDomainMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracking Domains</h1>
          <p className="text-muted-foreground mt-1">
            Manage domains used for email tracking and link redirection
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tracking-domains'] })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Domain
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tracking Domain</DialogTitle>
                <DialogDescription>
                  Add a new domain to the tracking domains pool
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="track.example.com"
                    value={newDomain.domain}
                    onChange={(e) => setNewDomain({ ...newDomain, domain: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select
                    value={newDomain.provider}
                    onValueChange={(value) => setNewDomain({ ...newDomain, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws_route53">AWS Route 53</SelectItem>
                      <SelectItem value="cloudflare">Cloudflare</SelectItem>
                      <SelectItem value="godaddy">GoDaddy</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newDomain.provider === 'aws_route53' && (
                  <div className="grid gap-2">
                    <Label htmlFor="hostedZoneId">Hosted Zone ID (optional)</Label>
                    <Input
                      id="hostedZoneId"
                      placeholder="Z1234567890ABC"
                      value={newDomain.hostedZoneId}
                      onChange={(e) => setNewDomain({ ...newDomain, hostedZoneId: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDomain} disabled={addDomainMutation.isPending}>
                  {addDomainMutation.isPending ? 'Adding...' : 'Add Domain'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Domains Table */}
      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
          <CardDescription>
            Track the status and assignment of tracking domains
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading domains...</div>
          ) : !domains || domains.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tracking domains found. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>SSL Status</TableHead>
                  <TableHead>Last Verified</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.full_domain}</TableCell>
                    <TableCell>{getStatusBadge(domain.status)}</TableCell>
                    <TableCell className="capitalize">{domain.provider.replace('_', ' ')}</TableCell>
                    <TableCell>
                      {domain.campaign_name || (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {domain.ssl_enabled ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {domain.ssl_days_remaining !== null && (
                            <span className="text-sm text-muted-foreground">
                              {domain.ssl_days_remaining}d left
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No SSL</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {domain.verified_at
                        ? new Date(domain.verified_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyDomainMutation.mutate(domain.id)}
                          disabled={verifyDomainMutation.isPending}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        {!domain.campaign_id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this domain?')) {
                                deleteDomainMutation.mutate(domain.id);
                              }
                            }}
                            disabled={deleteDomainMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
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
