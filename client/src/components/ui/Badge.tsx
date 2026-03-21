import { cn } from '../../lib/cn';
import type { HealthStatus } from '@spirulina/shared';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeVariants[variant],
      className,
    )}>
      {children}
    </span>
  );
}

export function HealthBadge({ status }: { status: HealthStatus }) {
  const config = {
    GREEN: { variant: 'success' as const, label: 'Healthy' },
    YELLOW: { variant: 'warning' as const, label: 'Warning' },
    RED: { variant: 'danger' as const, label: 'Critical' },
  };
  const { variant, label } = config[status] || config.GREEN;
  return <Badge variant={variant}>{label}</Badge>;
}
