import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
  loading?: boolean;
}

export default function StatCard({ title, value, icon, trend, trendUp, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-4 w-[60%] mb-4" />
          <Skeleton className="h-8 w-[80%]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">
              {title}
            </p>
            <h3 className="text-3xl font-semibold tracking-tight">
              {value}
            </h3>
            {trend && (
              <p
                className={cn(
                  "text-xs mt-2",
                  trendUp ? "text-green-600" : "text-red-600"
                )}
              >
                {trend}
              </p>
            )}
          </div>
          {icon && (
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
