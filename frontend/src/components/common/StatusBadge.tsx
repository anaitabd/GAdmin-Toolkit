import { Chip, type ChipProps } from '@mui/material';

interface StatusBadgeProps {
  status: string;
  colorMap?: Record<string, ChipProps['color']>;
}

const defaultColorMap: Record<string, ChipProps['color']> = {
  active: 'success',
  paused: 'warning',
  suspended: 'error',
  warming_up: 'info',
  cancelled: 'error',
  pending: 'default',
  creating: 'info',
  failed: 'error',
  deleted: 'default',
};

export default function StatusBadge({ status, colorMap }: StatusBadgeProps) {
  const colors = { ...defaultColorMap, ...colorMap };
  const color = colors[status] || 'default';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return <Chip label={label} color={color} size="small" />;
}
