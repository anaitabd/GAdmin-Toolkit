'use client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AnalyticsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            View detailed analytics and performance metrics
          </p>
        </div>
        <Select defaultValue="7">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The analytics dashboard will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Period selector (7/30/90 days + custom date range)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              KPI cards: Sent, Delivered, Opens, Clicks, Bounces + Rates
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Multi-line chart showing daily metrics (Recharts)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Donut chart for status distribution
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Bar chart for top 5 campaigns by opens
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Sortable campaigns metrics table
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Export to CSV functionality
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
