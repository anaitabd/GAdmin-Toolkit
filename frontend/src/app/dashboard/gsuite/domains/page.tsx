'use client';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GsuiteDomainsPage() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">G Suite Domains</h1>
          <p className="text-muted-foreground mt-1">
            Manage Google Workspace domains and service accounts
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Domain
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            The G Suite domains management interface will be implemented here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Table with domain, customer ID, admin email, status, verified, users count
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Status badges (active/suspended/deleted)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Add domain dialog with form validation
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Upload service account dialog (drag & drop .json file)
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              JSON validation for required keys
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Test authentication button
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              View users and sync functionality
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              Delete domain with confirmation
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
