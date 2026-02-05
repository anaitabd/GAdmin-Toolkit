'use client';

import { useState } from 'react';
import { 
  MailOpen, 
  MousePointerClick, 
  UserX, 
  AlertCircle,
  Download,
  Search,
  Calendar,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data for tracking events
const mockEvents = [
  {
    id: 1,
    timestamp: '2024-02-05 14:32:10',
    type: 'open',
    recipient: 'john@example.com',
    campaign: 'Spring Sale 2024',
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 2,
    timestamp: '2024-02-05 14:30:45',
    type: 'click',
    recipient: 'jane@example.com',
    campaign: 'Newsletter Feb',
    ip: '192.168.1.2',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 3,
    timestamp: '2024-02-05 14:28:20',
    type: 'unsubscribe',
    recipient: 'bob@example.com',
    campaign: 'Spring Sale 2024',
    ip: '192.168.1.3',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)',
  },
  {
    id: 4,
    timestamp: '2024-02-05 14:25:15',
    type: 'bounce',
    recipient: 'invalid@example.com',
    campaign: 'Newsletter Feb',
    ip: 'N/A',
    userAgent: 'N/A',
  },
  {
    id: 5,
    timestamp: '2024-02-05 14:20:30',
    type: 'open',
    recipient: 'alice@example.com',
    campaign: 'Product Launch',
    ip: '192.168.1.4',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
];

const eventTypeConfig = {
  open: { label: 'Opens', icon: MailOpen, color: 'bg-blue-500' },
  click: { label: 'Clicks', icon: MousePointerClick, color: 'bg-green-500' },
  unsubscribe: { label: 'Unsubscribes', icon: UserX, color: 'bg-orange-500' },
  bounce: { label: 'Bounces', icon: AlertCircle, color: 'bg-red-500' },
};

export default function TrackingEventsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate stats
  const stats = {
    opens: mockEvents.filter(e => e.type === 'open').length,
    clicks: mockEvents.filter(e => e.type === 'click').length,
    unsubscribes: mockEvents.filter(e => e.type === 'unsubscribe').length,
    bounces: mockEvents.filter(e => e.type === 'bounce').length,
  };

  // Filter events
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = 
      event.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.campaign.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = eventTypeFilter === 'all' || event.type === eventTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getEventBadgeVariant = (type: string) => {
    switch (type) {
      case 'open': return 'default';
      case 'click': return 'default';
      case 'unsubscribe': return 'default';
      case 'bounce': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Tracking Events</h1>
        <p className="text-muted-foreground mt-1">
          Monitor real-time email engagement events and track recipient behavior
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(eventTypeConfig).map(([type, config]) => {
          const Icon = config.icon;
          const count = stats[type as keyof typeof stats];
          return (
            <Card key={type}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {config.label}
                </CardTitle>
                <div className={`p-2 rounded-lg ${config.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total events recorded
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setEventTypeFilter('all')}>
            All Events
          </TabsTrigger>
          <TabsTrigger value="open" onClick={() => setEventTypeFilter('open')}>
            Opens
          </TabsTrigger>
          <TabsTrigger value="click" onClick={() => setEventTypeFilter('click')}>
            Clicks
          </TabsTrigger>
          <TabsTrigger value="unsubscribe" onClick={() => setEventTypeFilter('unsubscribe')}>
            Unsubscribes
          </TabsTrigger>
          <TabsTrigger value="bounce" onClick={() => setEventTypeFilter('bounce')}>
            Bounces
          </TabsTrigger>
        </TabsList>

        <TabsContent value={eventTypeFilter === 'all' ? 'all' : eventTypeFilter} className="space-y-4">
          {/* Filters and Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Event Log</CardTitle>
              <CardDescription>
                View and filter all tracking events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by recipient or campaign..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Event Type Filter */}
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="open">Opens</SelectItem>
                    <SelectItem value="click">Clicks</SelectItem>
                    <SelectItem value="unsubscribe">Unsubscribes</SelectItem>
                    <SelectItem value="bounce">Bounces</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range (placeholder) */}
                <Button variant="outline" className="w-full sm:w-auto">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date Range
                </Button>

                {/* Export Button */}
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Events Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User Agent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedEvents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No events found
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell className="font-mono text-sm">
                            {event.timestamp}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getEventBadgeVariant(event.type)}>
                              {event.type}
                            </Badge>
                          </TableCell>
                          <TableCell>{event.recipient}</TableCell>
                          <TableCell>{event.campaign}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {event.ip}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                            {event.userAgent}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {filteredEvents.length > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of{' '}
                    {filteredEvents.length} events
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
