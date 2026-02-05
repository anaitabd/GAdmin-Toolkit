import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, string>;
}

const defaultColorMap: Record<string, string> = {
  active: 'bg-green-500 hover:bg-green-600',
  paused: 'bg-yellow-500 hover:bg-yellow-600',
  suspended: 'bg-red-500 hover:bg-red-600',
  warming_up: 'bg-blue-500 hover:bg-blue-600',
  cancelled: 'bg-red-500 hover:bg-red-600',
  pending: 'bg-gray-500 hover:bg-gray-600',
  creating: 'bg-blue-500 hover:bg-blue-600',
  failed: 'bg-red-500 hover:bg-red-600',
  deleted: 'bg-gray-500 hover:bg-gray-600',
  paused_limit_reached: 'bg-orange-500 hover:bg-orange-600',
};

export default function StatusBadge({ status, colorMap }: StatusBadgeProps) {
  const colors = { ...defaultColorMap, ...colorMap };
  const color = colors[status] || 'bg-gray-500 hover:bg-gray-600';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return <Badge className={cn(color, 'text-white')}>{label}</Badge>;
}
