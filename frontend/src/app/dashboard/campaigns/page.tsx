'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CampaignsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your email campaigns and view their performance
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Campaign
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The campaigns table and details page will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Table with name, status, sent, opens, clicks, and rates
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Filter by status (All, Active, Cancelled)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Search by campaign name
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Campaign creation dialog
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Details page with KPI cards, timeline chart, and tabs
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Cancel campaign functionality
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Real-time polling every 10 seconds
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
