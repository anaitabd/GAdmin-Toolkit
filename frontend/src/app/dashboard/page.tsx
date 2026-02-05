'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  CheckCircle,
  MailOpen,
  MousePointerClick,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { analyticsApi } from '@/lib/api/analytics';
import { useAuthStore } from '@/lib/stores/authStore';
import StatCard from '@/components/common/StatCard';
import { formatNumber, formatPercent } from '@/lib/utils/formatters';
import { usePolling } from '@/lib/hooks/usePolling';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data: analytics, isLoading } = usePolling(
    ['analytics', 'overview'],
    () => analyticsApi.getOverview(7),
    10000
  );

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight mb-2">
        Dashboard Overview
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last 7 days performance metrics
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Sent Today"
          value={isLoading ? '...' : formatNumber(analytics?.sent || 0)}
          icon={<Send className="w-6 h-6" />}
          loading={isLoading}
        />
        <StatCard
          title="Delivery Rate"
          value={isLoading ? '...' : formatPercent(analytics?.delivery_rate || 0)}
          icon={<CheckCircle className="w-6 h-6" />}
          loading={isLoading}
        />
        <StatCard
          title="Open Rate"
          value={isLoading ? '...' : formatPercent(analytics?.open_rate || 0)}
          icon={<MailOpen className="w-6 h-6" />}
          loading={isLoading}
        />
        <StatCard
          title="Click Rate"
          value={isLoading ? '...' : formatPercent(analytics?.click_rate || 0)}
          icon={<MousePointerClick className="w-6 h-6" />}
          loading={isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Welcome to GAdmin Toolkit</CardTitle>
          <CardDescription>
            This is a production-grade Next.js 14 dashboard for managing email campaigns, sender accounts, and G Suite users.
            Use the sidebar to navigate to different sections.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
