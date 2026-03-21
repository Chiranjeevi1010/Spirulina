import { useNavigate } from 'react-router-dom';
import { Droplets, MapPin, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { Card, CardBody, Badge, HealthBadge } from '../ui';
import type { Pond } from '@spirulina/shared';
import { cn } from '../../lib/cn';

interface PondCardProps {
  pond: Pond;
  onEdit?: (pond: Pond) => void;
  onDelete?: (pond: Pond) => void;
}

const healthBorderMap: Record<string, string> = {
  GREEN: 'border-l-4 border-l-green-500',
  YELLOW: 'border-l-4 border-l-yellow-500',
  RED: 'border-l-4 border-l-red-500',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  inactive: 'danger',
  maintenance: 'warning',
};

export function PondCard({ pond, onEdit, onDelete }: PondCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className={cn('cursor-pointer hover:shadow-md transition-shadow', healthBorderMap[pond.healthStatus] || '')}
      onClick={() => navigate(`/ponds/${pond.id}`)}
    >
      <CardBody>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-gray-900">{pond.name}</h3>
            <p className="text-sm text-gray-500">{pond.code}</p>
          </div>
          <div className="flex items-center gap-2">
            {(onEdit || onDelete) && (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {onEdit && (
                  <button
                    className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                    onClick={() => onEdit(pond)}
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    onClick={() => onDelete(pond)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
            <HealthBadge status={pond.healthStatus} />
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Droplets className="w-4 h-4" />
            <span>{Number(pond.volumeLiters).toLocaleString()} liters</span>
          </div>

          {pond.location && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{pond.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
          <Badge variant={statusColors[pond.status] || 'default'}>
            {pond.status}
          </Badge>
          <span className="text-xs text-gray-400 capitalize">{pond.pondType?.replace('_', ' ')}</span>
          <ArrowRight className="w-4 h-4 text-gray-400" />
        </div>
      </CardBody>
    </Card>
  );
}
