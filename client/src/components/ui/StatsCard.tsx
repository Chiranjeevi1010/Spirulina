import { cn } from '../../lib/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  change?: number;
  changeLabel?: string;
  className?: string;
}

export function StatsCard({ title, value, icon, change, changeLabel, className }: StatsCardProps) {
  return (
    <div className={cn('card card-body', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {change > 0 ? (
                <TrendingUp size={14} className="text-green-600" />
              ) : change < 0 ? (
                <TrendingDown size={14} className="text-red-600" />
              ) : (
                <Minus size={14} className="text-gray-400" />
              )}
              <span className={cn(
                'text-xs font-medium',
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-400',
              )}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && <span className="text-xs text-gray-400">{changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-primary-50">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
