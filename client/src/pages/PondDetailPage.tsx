import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Droplets, Activity, Thermometer } from 'lucide-react';
import { Button, Card, CardBody, CardTitle, HealthBadge, Badge, Tabs, DataTable, PageLoader, EmptyState, StatsCard, Pagination } from '../components/ui';
import { PondForm, WaterParameterForm, ParameterTrendChart } from '../components/ponds';
import { usePond, useWaterParameters, useLatestReading, useDeletePond } from '../hooks/usePonds';
import type { WaterParameter } from '@spirulina/shared';

type Column<T> = { key: string; header: string; render?: (row: T) => React.ReactNode };

export default function PondDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pondId = Number(id);

  const { data: pond, isLoading } = usePond(pondId);
  const { data: latestReading } = useLatestReading(pondId);
  const deletePond = useDeletePond();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showWaterForm, setShowWaterForm] = useState(false);
  const [wpPage, setWpPage] = useState(1);
  const [selectedParam, setSelectedParam] = useState('ph');

  const { data: wpData } = useWaterParameters(pondId, { page: wpPage, limit: 10 });
  const waterParams = wpData?.data ?? [];
  const wpPagination = wpData?.meta;

  if (isLoading) return <PageLoader />;
  if (!pond) return <EmptyState title="Pond not found" description="The pond you're looking for doesn't exist" />;

  const handleDelete = () => {
    if (confirm('Are you sure you want to deactivate this pond?')) {
      deletePond.mutate(pondId, { onSuccess: () => navigate('/ponds') });
    }
  };

  const waterParamColumns: Column<WaterParameter>[] = [
    { key: 'readingDate', header: 'Date' },
    { key: 'readingTime', header: 'Time', render: (row) => <span className="capitalize">{row.readingTime}</span> },
    { key: 'temperatureC', header: 'Temp °C', render: (row) => row.temperatureC ?? '-' },
    { key: 'ph', header: 'pH', render: (row) => row.ph ?? '-' },
    { key: 'dissolvedOxygen', header: 'DO mg/L', render: (row) => row.dissolvedOxygen ?? '-' },
    { key: 'ammoniaNh3', header: 'NH3 mg/L', render: (row) => row.ammoniaNh3 ?? '-' },
    { key: 'totalHardness', header: 'Hardness', render: (row) => row.totalHardness ?? '-' },
    { key: 'overallRisk', header: 'Risk', render: (row) => <HealthBadge status={row.overallRisk} /> },
  ];

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <Activity className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Volume" value={`${Number(pond.volumeLiters).toLocaleString()} L`} icon={<Droplets className="w-5 h-5" />} />
            <StatsCard title="Dimensions" value={`${pond.lengthM} × ${pond.widthM} × ${pond.depthM}m`} />
            <StatsCard title="Type" value={String(pond.pondType).replace('_', ' ')} />
            <StatsCard title="Status" value={pond.status} />
          </div>

          {/* Latest Reading */}
          {latestReading && (
            <Card>
              <CardBody>
                <CardTitle>Latest Water Reading ({latestReading.readingDate})</CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="text-lg font-semibold">{latestReading.temperatureC ?? '-'}°C</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">pH</p>
                    <p className="text-lg font-semibold">{latestReading.ph ?? '-'}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">DO</p>
                    <p className="text-lg font-semibold">{latestReading.dissolvedOxygen ?? '-'} mg/L</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Ammonia</p>
                    <p className="text-lg font-semibold">{latestReading.ammoniaNh3 ?? '-'} mg/L</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Hardness</p>
                    <p className="text-lg font-semibold">{latestReading.totalHardness ?? '-'}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Overall Risk</p>
                    <div className="mt-1"><HealthBadge status={latestReading.overallRisk} /></div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Pond Info */}
          <Card>
            <CardBody>
              <CardTitle>Pond Information</CardTitle>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div><span className="text-gray-500">Location:</span> <span className="ml-2 font-medium">{pond.location || 'N/A'}</span></div>
                <div><span className="text-gray-500">Commissioned:</span> <span className="ml-2 font-medium">{pond.dateCommissioned || 'N/A'}</span></div>
                <div><span className="text-gray-500">Created:</span> <span className="ml-2 font-medium">{new Date(pond.createdAt).toLocaleDateString()}</span></div>
                <div><span className="text-gray-500">Notes:</span> <span className="ml-2 font-medium">{pond.notes || 'None'}</span></div>
              </div>
            </CardBody>
          </Card>
        </div>
      ),
    },
    {
      id: 'water-params',
      label: 'Water Parameters',
      icon: <Thermometer className="w-4 h-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Water Parameter History</h3>
            <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowWaterForm(true)}>
              Log Reading
            </Button>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between mb-4">
                <CardTitle>Trend Chart</CardTitle>
                <select
                  value={selectedParam}
                  onChange={e => setSelectedParam(e.target.value)}
                  className="input-field w-48"
                >
                  <option value="ph">pH</option>
                  <option value="temperatureC">Temperature</option>
                  <option value="dissolvedOxygen">Dissolved Oxygen</option>
                  <option value="ammoniaNh3">Ammonia NH3</option>
                  <option value="totalHardness">Total Hardness</option>
                  <option value="salinityPpt">Salinity</option>
                  <option value="magnesiumMg">Magnesium</option>
                  <option value="calciumCa">Calcium</option>
                </select>
              </div>
              <ParameterTrendChart data={waterParams} parameter={selectedParam} />
            </CardBody>
          </Card>

          {/* Data Table */}
          <DataTable columns={waterParamColumns} data={waterParams} emptyMessage="No water parameter readings yet" />

          {wpPagination && wpPagination.totalPages > 1 && (
            <Pagination page={wpPagination.page} totalPages={wpPagination.totalPages} onPageChange={setWpPage} />
          )}
        </div>
      ),
    },
    {
      id: 'harvests',
      label: 'Harvests',
      icon: <Droplets className="w-4 h-4" />,
      content: (
        <EmptyState title="Harvests" description="Harvest data for this pond will appear here" />
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ponds')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{pond.name}</h1>
            <span className="text-gray-400">({pond.code})</span>
            <HealthBadge status={pond.healthStatus} />
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => setShowEditForm(true)}>
          Edit
        </Button>
        <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>
          Deactivate
        </Button>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} defaultTab="overview" />

      {/* Modals */}
      <PondForm isOpen={showEditForm} onClose={() => setShowEditForm(false)} pond={pond} />
      <WaterParameterForm isOpen={showWaterForm} onClose={() => setShowWaterForm(false)} pondId={pondId} pondName={pond ? `${pond.name} (${pond.code})` : undefined} />
    </div>
  );
}
