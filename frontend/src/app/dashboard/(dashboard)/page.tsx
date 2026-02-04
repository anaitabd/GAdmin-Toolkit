'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Grid, Typography, Card, CardContent, Skeleton } from '@mui/material';
import {
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
  OpenInNew as OpenIcon,
  TouchApp as ClickIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
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
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Dashboard Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Last 7 days performance metrics
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <StatCard
          title="Sent Today"
          value={isLoading ? '...' : formatNumber(analytics?.sent || 0)}
          icon={<SendIcon />}
          loading={isLoading}
        />
        <StatCard
          title="Delivery Rate"
          value={isLoading ? '...' : formatPercent(analytics?.delivery_rate || 0)}
          icon={<CheckCircleIcon />}
          loading={isLoading}
        />
        <StatCard
          title="Open Rate"
          value={isLoading ? '...' : formatPercent(analytics?.open_rate || 0)}
          icon={<OpenIcon />}
          loading={isLoading}
        />
        <StatCard
          title="Click Rate"
          value={isLoading ? '...' : formatPercent(analytics?.click_rate || 0)}
          icon={<ClickIcon />}
          loading={isLoading}
        />
      </Box>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Welcome to GAdmin Toolkit
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This is a production-grade Next.js 14 dashboard for managing email campaigns, sender accounts, and G Suite users.
            Use the sidebar to navigate to different sections.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
