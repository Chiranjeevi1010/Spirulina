import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Droplets, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Modal, Pagination, PageLoader, EmptyState, Badge, HealthBadge } from '../components/ui';
import { pondsApi } from '../services/ponds.api';
import { usePonds, useWaterParameters, useCreateWaterParameter, useUpdateWaterParameter, useDeleteWaterParameter } from '../hooks/usePonds';
import type { WaterParameter, CreateWaterParameterRequest } from '@spirulina/shared';

const readingTimeOptions = [
  { value: 'morning', label: 'Morning (6-9 AM)' },
  { value: 'noon', label: 'Noon (12-3 PM)' },
  { value: 'evening', label: 'Evening (5-7 PM)' },
];

const foamLevelOptions = [
  { value: '', label: 'Select...' },
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const defaultForm = {
  readingDate: new Date().toISOString().slice(0, 10),
  readingTime: 'morning' as string,
  ph: '',
  salinityPpt: '',
  temperatureC: '',
  carbonateCo3: '',
  bicarbonateHco3: '',
  alkalinity: '',
  totalHardness: '',
  calciumCa: '',
  magnesiumMg: '',
  sodiumNa: '',
  potassiumK: '',
  totalAmmonia: '',
  ammoniaNh3: '',
  nitriteNo2: '',
  dissolvedOxygen: '',
  nitrateNo3: '',
  foamLevel: '',
  paddleWheelRpm: '',
  harvestPercentage: '',
  notes: '',
};

export default function WaterParametersPage() {
  const queryClient = useQueryClient();
  const [selectedPondId, setSelectedPondId] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<WaterParameter | null>(null);
  const [form, setForm] = useState(defaultForm);

  const { data: pondsData, isLoading: pondsLoading } = usePonds({ limit: 100 });
  const pondsList = pondsData?.data ?? [];
  const selectedPond = pondsList.find(p => p.id === selectedPondId);

  // Auto-select first pond if none selected
  useEffect(() => {
    if (!selectedPondId && pondsList.length > 0) {
      setSelectedPondId(pondsList[0].id);
    }
  }, [pondsList, selectedPondId]);

  const { data: readingsData, isLoading: readingsLoading } = useWaterParameters(selectedPondId, { page, limit: 15 });
  const readings = readingsData?.data ?? [];
  const pagination = readingsData?.meta;

  const createMutation = useCreateWaterParameter();
  const updateMutation = useUpdateWaterParameter();
  const deleteMutation = useDeleteWaterParameter();

  const resetForm = () => {
    setForm(defaultForm);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    resetForm();
  };

  const handleEdit = (item: WaterParameter) => {
    setEditingItem(item);
    setForm({
      readingDate: item.readingDate ? item.readingDate.split('T')[0] : '',
      readingTime: item.readingTime || 'morning',
      temperatureC: item.temperatureC != null ? String(item.temperatureC) : '',
      ph: item.ph != null ? String(item.ph) : '',
      dissolvedOxygen: item.dissolvedOxygen != null ? String(item.dissolvedOxygen) : '',
      salinityPpt: item.salinityPpt != null ? String(item.salinityPpt) : '',
      alkalinity: item.alkalinity != null ? String(item.alkalinity) : '',
      carbonateCo3: item.carbonateCo3 != null ? String(item.carbonateCo3) : '',
      bicarbonateHco3: item.bicarbonateHco3 != null ? String(item.bicarbonateHco3) : '',
      totalHardness: item.totalHardness != null ? String(item.totalHardness) : '',
      calciumCa: item.calciumCa != null ? String(item.calciumCa) : '',
      magnesiumMg: item.magnesiumMg != null ? String(item.magnesiumMg) : '',
      sodiumNa: (item as any).sodiumNa != null ? String((item as any).sodiumNa) : '',
      potassiumK: (item as any).potassiumK != null ? String((item as any).potassiumK) : '',
      totalAmmonia: (item as any).totalAmmonia != null ? String((item as any).totalAmmonia) : '',
      ammoniaNh3: item.ammoniaNh3 != null ? String(item.ammoniaNh3) : '',
      nitriteNo2: item.nitriteNo2 != null ? String(item.nitriteNo2) : '',
      nitrateNo3: item.nitrateNo3 != null ? String(item.nitrateNo3) : '',
      foamLevel: item.foamLevel || '',
      paddleWheelRpm: item.paddleWheelRpm != null ? String(item.paddleWheelRpm) : '',
      harvestPercentage: item.harvestPercentage != null ? String(item.harvestPercentage) : '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPondId) return;

    const toNum = (v: string) => v !== '' ? Number(v) : undefined;
    const payload: CreateWaterParameterRequest = {
      readingDate: form.readingDate,
      readingTime: form.readingTime as any,
      temperatureC: toNum(form.temperatureC),
      ph: toNum(form.ph),
      dissolvedOxygen: toNum(form.dissolvedOxygen),
      salinityPpt: toNum(form.salinityPpt),
      alkalinity: toNum(form.alkalinity),
      carbonateCo3: toNum(form.carbonateCo3),
      bicarbonateHco3: toNum(form.bicarbonateHco3),
      totalHardness: toNum(form.totalHardness),
      calciumCa: toNum(form.calciumCa),
      magnesiumMg: toNum(form.magnesiumMg),
      sodiumNa: toNum(form.sodiumNa),
      potassiumK: toNum(form.potassiumK),
      totalAmmonia: toNum(form.totalAmmonia),
      ammoniaNh3: toNum(form.ammoniaNh3),
      nitriteNo2: toNum(form.nitriteNo2),
      nitrateNo3: toNum(form.nitrateNo3),
      foamLevel: (form.foamLevel || undefined) as any,
      paddleWheelRpm: toNum(form.paddleWheelRpm),
      harvestPercentage: toNum(form.harvestPercentage),
      notes: form.notes || undefined,
    };

    if (editingItem) {
      updateMutation.mutate(
        { pondId: selectedPondId, id: editingItem.id, data: payload },
        { onSuccess: () => closeModal() },
      );
    } else {
      createMutation.mutate(
        { pondId: selectedPondId, data: payload },
        { onSuccess: () => closeModal() },
      );
    }
  };

  const handleDelete = (item: WaterParameter) => {
    if (!selectedPondId) return;
    if (confirm('Delete this reading?')) {
      deleteMutation.mutate({ pondId: selectedPondId, id: item.id });
    }
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const columns = [
    {
      key: 'readingDate',
      header: 'Date',
      render: (item: WaterParameter) => item.readingDate ? new Date(item.readingDate).toLocaleDateString() : '-',
    },
    {
      key: 'readingTime',
      header: 'Time',
      render: (item: WaterParameter) => (
        <span className="capitalize">{item.readingTime || '-'}</span>
      ),
    },
    {
      key: 'temperatureC',
      header: 'Temp (°C)',
      render: (item: WaterParameter) => item.temperatureC != null ? Number(item.temperatureC).toFixed(1) : '-',
    },
    {
      key: 'ph',
      header: 'pH',
      render: (item: WaterParameter) => item.ph != null ? Number(item.ph).toFixed(2) : '-',
    },
    {
      key: 'dissolvedOxygen',
      header: 'DO (mg/L)',
      render: (item: WaterParameter) => item.dissolvedOxygen != null ? Number(item.dissolvedOxygen).toFixed(1) : '-',
    },
    {
      key: 'ammoniaNh3',
      header: 'NH3 (mg/L)',
      render: (item: WaterParameter) => item.ammoniaNh3 != null ? Number(item.ammoniaNh3).toFixed(2) : '-',
    },
    {
      key: 'overallRisk',
      header: 'Risk',
      render: (item: WaterParameter) => <HealthBadge status={item.overallRisk} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: WaterParameter) => (
        <div className="flex items-center gap-2">
          <button
            className="p-1 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded"
            onClick={() => handleEdit(item)}
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
            onClick={() => handleDelete(item)}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const isLoading = pondsLoading || readingsLoading;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Water Parameters</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage water quality readings</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowModal(true)}
          disabled={!selectedPondId}
        >
          Add Reading
        </Button>
      </div>

      {/* Pond selector */}
      <div className="mb-6">
        <select
          value={selectedPondId ?? ''}
          onChange={(e) => { setSelectedPondId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="input-field w-full sm:w-64"
        >
          <option value="">Select a pond...</option>
          {pondsList.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {!selectedPondId ? (
        <EmptyState
          icon={<Droplets size={48} />}
          title="Select a pond"
          description="Choose a pond above to view its water parameter readings"
        />
      ) : isLoading ? (
        <PageLoader />
      ) : readings.length === 0 ? (
        <EmptyState
          icon={<Droplets size={48} />}
          title="No readings yet"
          description="Add your first water parameter reading for this pond"
          action={<Button onClick={() => setShowModal(true)}>Add Reading</Button>}
        />
      ) : (
        <>
          <DataTable columns={columns} data={readings} />
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={`${editingItem ? 'Edit' : 'Add'} Water Parameters — ${selectedPond?.name ?? ''} (${selectedPond?.code ?? ''})`} size="xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardBody>
              <CardTitle>Reading Info</CardTitle>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <Input label="Reading Date" type="date" value={form.readingDate} onChange={(e) => updateField('readingDate', e.target.value)} required />
                <Select
                  label="Reading Time"
                  options={readingTimeOptions}
                  value={form.readingTime}
                  onChange={(e) => updateField('readingTime', e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          {/* Water Quality */}
          <Card>
            <CardBody>
              <CardTitle>Water Quality</CardTitle>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <Input label="pH" type="number" step="0.01" value={form.ph} onChange={(e) => updateField('ph', e.target.value)} />
                <Input label="Salinity (ppt)" type="number" step="0.1" value={form.salinityPpt} onChange={(e) => updateField('salinityPpt', e.target.value)} />
                <Input label="Temperature (°C)" type="number" step="0.1" value={form.temperatureC} onChange={(e) => updateField('temperatureC', e.target.value)} />
              </div>
            </CardBody>
          </Card>

          {/* Carbonates & Alkalinity */}
          <Card>
            <CardBody>
              <CardTitle>Carbonates & Alkalinity</CardTitle>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <Input label="Carbonates CO3 (mg/L)" type="number" step="1" value={form.carbonateCo3} onChange={(e) => updateField('carbonateCo3', e.target.value)} />
                <Input label="Bicarbonates HCO3 (mg/L)" type="number" step="1" value={form.bicarbonateHco3} onChange={(e) => updateField('bicarbonateHco3', e.target.value)} />
                <Input label="Total Alkalinity (mg/L)" type="number" step="1" value={form.alkalinity} onChange={(e) => updateField('alkalinity', e.target.value)} />
              </div>
            </CardBody>
          </Card>

          {/* Hardness & Minerals */}
          <Card>
            <CardBody>
              <CardTitle>Hardness & Minerals</CardTitle>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <Input label="Total Hardness (mg/L)" type="number" step="1" value={form.totalHardness} onChange={(e) => updateField('totalHardness', e.target.value)} />
                <Input label="Calcium Ca (mg/L)" type="number" step="1" value={form.calciumCa} onChange={(e) => updateField('calciumCa', e.target.value)} />
                <Input label="Magnesium Mg (mg/L)" type="number" step="1" value={form.magnesiumMg} onChange={(e) => updateField('magnesiumMg', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <Input label="Sodium Na (mg/L)" type="number" step="1" value={form.sodiumNa} onChange={(e) => updateField('sodiumNa', e.target.value)} />
                <Input label="Potassium K (mg/L)" type="number" step="1" value={form.potassiumK} onChange={(e) => updateField('potassiumK', e.target.value)} />
              </div>
            </CardBody>
          </Card>

          {/* Nitrogen & Dissolved Oxygen */}
          <Card>
            <CardBody>
              <CardTitle>Nitrogen & Dissolved Oxygen</CardTitle>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <Input label="Total Ammonia (mg/L)" type="number" step="0.01" value={form.totalAmmonia} onChange={(e) => updateField('totalAmmonia', e.target.value)} />
                <Input label="Un-ionized NH3 (mg/L)" type="number" step="0.01" value={form.ammoniaNh3} onChange={(e) => updateField('ammoniaNh3', e.target.value)} />
                <Input label="Nitrite NO2 (mg/L)" type="number" step="0.01" value={form.nitriteNo2} onChange={(e) => updateField('nitriteNo2', e.target.value)} />
                <Input label="DO (mg/L)" type="number" step="0.1" value={form.dissolvedOxygen} onChange={(e) => updateField('dissolvedOxygen', e.target.value)} />
              </div>
            </CardBody>
          </Card>

          {/* Other */}
          <Card>
            <CardBody>
              <CardTitle>Other Parameters</CardTitle>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <Select label="Foam Level" options={foamLevelOptions} value={form.foamLevel} onChange={(e) => updateField('foamLevel', e.target.value)} />
                <Input label="Paddle Wheel RPM" type="number" step="1" value={form.paddleWheelRpm} onChange={(e) => updateField('paddleWheelRpm', e.target.value)} />
                <Input label="Harvest %" type="number" step="0.1" value={form.harvestPercentage} onChange={(e) => updateField('harvestPercentage', e.target.value)} />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  className="input-field min-h-[60px]"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Observations..."
                />
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Update Reading' : 'Save Reading'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
