'use client';
import { RefreshCw, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GsuiteUsersPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">G Suite Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage Google Workspace users and bulk operations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Generate Users
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Select defaultValue="">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Domain" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">No domains available</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon - Most Complex Feature</CardTitle>
          <CardDescription>
            The G Suite users management interface will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            This is the most complex feature with:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Domain selector:</strong> Dropdown that reloads table on change</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Users table:</strong> Multi-select checkboxes, email, name, status, created date</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Status badges:</strong> pending (grey), creating (blue spinner), active (green), failed (red with tooltip)</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Filters:</strong> All, Pending, Active, Failed</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Generate Users:</strong> Dialog with count and password inputs</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Bulk Create:</strong> Async operation with progress modal</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Bulk Delete:</strong> Confirmation + progress modal</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Progress Modal:</strong> Live updates, percentage bar, status list, polling every 2s</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Auto-complete detection:</strong> Closes when all users are active/failed</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Create Sender Accounts:</strong> Converts users to sender accounts</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2 font-bold">•</span>
              <span><strong>Sync from Google:</strong> Fetches latest users from Google API</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
