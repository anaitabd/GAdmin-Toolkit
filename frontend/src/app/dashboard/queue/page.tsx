'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function QueuePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Email Queue</h1>
        <p className="text-muted-foreground mt-1">
          Manage your email queue and enqueue new emails
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Processing</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Sent</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-3xl font-bold mt-2">0</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The email queue management interface will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Real-time status cards with polling every 5 seconds
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Current rate display (emails/minute)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Enqueue form with manual and CSV upload tabs
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Drag & drop CSV uploader with PapaParse integration
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Preview first 10 rows before importing
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Bar chart showing status distribution
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Clear Failed and Retry Failed actions with confirmations
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
