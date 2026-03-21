import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

const alertConfig = {
  info: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800', icon: Info },
  success: { bg: 'bg-green-50 border-green-200', text: 'text-green-800', icon: CheckCircle },
  warning: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-800', icon: AlertTriangle },
  error: { bg: 'bg-red-50 border-red-200', text: 'text-red-800', icon: AlertCircle },
};

export function Alert({ variant = 'info', title, children, onClose, className }: AlertProps) {
  const config = alertConfig[variant];
  const Icon = config.icon;
  return (
    <div className={cn('flex items-start gap-3 p-4 rounded-lg border', config.bg, className)}>
      <Icon size={20} className={cn('flex-shrink-0 mt-0.5', config.text)} />
      <div className="flex-1">
        {title && <p className={cn('font-medium', config.text)}>{title}</p>}
        <div className={cn('text-sm', config.text)}>{children}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className={cn('flex-shrink-0', config.text)}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
