import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Factory, TrendingUp, Package, Droplets, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, DataTable, Modal, Pagination, PageLoader, EmptyState, StatsCard, Badge } from '../components/ui';
import { productionApi } from '../services/modules.api';

const outputTypeOptions = [
  { value: 'powder', label: 'Powder (Dried)' },
  { value: 'wet', label: 'Wet (Direct Sale)' },
  { value: 'both', label: 'Both (Wet + Powder)' },
];

const dryerTypeOptions = [
  { value: 'none', label: 'No Drying' },
  { value: 'spray', label: 'Spray Dryer' },
  { value: 'tray', label: 'Tray Dryer' },
  { value: 'solar', label: 'Solar Dryer' },
  { value: 'drum', label: 'Drum Dryer' },
];

export default function ProductionPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [form, setForm] = useState({
    productionDate: new Date().toISOString().split('T')[0],
    wetInputKg: '',
    outputType: 'powder',
    wetOutputKg: '',
    powderOutputKg: '',
    dryerType: 'spray',
    dryingTimeHours: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['production', { page, limit: 20 }],
    queryFn: () => productionApi.list({ page, limit: 20 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['production-stats'],
    queryFn: () => productionApi.getStats(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => productionApi.create(data),
    onSuccess: () => {
      toast.success('Production record added');
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['production-stats'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to add production record'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => productionApi.update(id, data),
    onSuccess: () => {
      toast.success('Production record updated');
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['production-stats'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update production record'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productionApi.delete(id),
    onSuccess: () => {
      toast.success('Production record deleted');
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['production-stats'] });
    },
    onError: () => toast.error('Failed to delete production record'),
  });

  const resetForm = () => {
    setEditingItem(null);
    setForm({
      productionDate: new Date().toISOString().split('T')[0],
      wetInputKg: '',
      outputType: 'powder',
      wetOutputKg: '',
      powderOutputKg: '',
      dryerType: 'spray',
      dryingTimeHours: '',
      notes: '',
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      productionDate: item.productionDate?.split('T')[0] || '',
      wetInputKg: String(item.wetInputKg || ''),
      outputType: item.outputType || 'powder',
      wetOutputKg: item.wetOutputKg ? String(item.wetOutputKg) : '',
      powderOutputKg: item.powderOutputKg ? String(item.powderOutputKg) : '',
      dryerType: item.dryerType || 'none',
      dryingTimeHours: item.dryingTimeHours ? String(item.dryingTimeHours) : '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      productionDate: form.productionDate,
      wetInputKg: Number(form.wetInputKg),
      outputType: form.outputType,
      wetOutputKg: form.wetOutputKg ? Number(form.wetOutputKg) : 0,
      powderOutputKg: form.powderOutputKg ? Number(form.powderOutputKg) : 0,
      dryerType: form.outputType === 'wet' ? 'none' : form.dryerType,
      dryingTimeHours: form.dryingTimeHours ? Number(form.dryingTimeHours) : undefined,
      notes: form.notes || undefined,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const records = data?.data ?? [];
  const pagination = data?.meta;

  const outputTypeBadge = (type: string) => {
    const variants: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
      powder: 'success',
      wet: 'info',
      both: 'warning',
    };
    const labels: Record<string, string> = {
      powder: 'Powder',
      wet: 'Wet Sale',
      both: 'Both',
    };
    return <Badge variant={variants[type] || 'default'}>{labels[type] || type}</Badge>;
  };

  const columns = [
    {
      key: 'productionDate',
      header: 'Date',
      render: (item: any) => new Date(item.productionDate).toLocaleDateString(),
    },
    {
      key: 'outputType',
      header: 'Type',
      render: (item: any) => outputTypeBadge(item.outputType || 'powder'),
    },
    {
      key: 'wetInputKg',
      header: 'Wet Input (kg)',
      render: (item: any) => Number(item.wetInputKg).toFixed(2),
    },
    {
      key: 'wetOutputKg',
      header: 'Wet Output (kg)',
      render: (item: any) => {
        const val = Number(item.wetOutputKg || 0);
        return val > 0 ? val.toFixed(2) : '-';
      },
    },
    {
      key: 'powderOutputKg',
      header: 'Powder (kg)',
      render: (item: any) => {
        const val = Number(item.powderOutputKg || 0);
        return val > 0 ? val.toFixed(2) : '-';
      },
    },
    {
      key: 'dryerType',
      header: 'Dryer',
      render: (item: any) => {
        const dt = item.dryerType;
        return dt && dt !== 'none' ? <span className="capitalize">{dt}</span> : '-';
      },
    },
    {
      key: 'efficiency',
      header: 'Yield %',
      render: (item: any) => {
        const totalOut = Number(item.wetOutputKg || 0) + Number(item.powderOutputKg || 0);
        const eff = Number(item.wetInputKg) > 0 ? (totalOut / Number(item.wetInputKg) * 100) : 0;
        return `${eff.toFixed(1)}%`;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<Pencil className="w-3 h-3" />} onClick={(e) => { e.stopPropagation(); handleEdit(item); }} />
          <Button size="sm" variant="ghost" icon={<Trash2 className="w-3 h-3 text-red-500" />} onClick={(e) => { e.stopPropagation(); if (confirm('Delete this production record?')) deleteMutation.mutate(item.id); }} />
        </div>
      ),
    },
  ];

  // Calculate totals from API stats (more accurate) or fallback to page data
  const statsData = stats as Record<string, unknown> | undefined;
  const totalInput = Number(statsData?.totalWetInput ?? records.reduce((sum: number, r: any) => sum + Number(r.wetInputKg || 0), 0));
  const totalPowder = Number(statsData?.totalPowderOutput ?? records.reduce((sum: number, r: any) => sum + Number(r.powderOutputKg || 0), 0));
  const totalWetOut = Number(statsData?.totalWetOutput ?? records.reduce((sum: number, r: any) => sum + Number(r.wetOutputKg || 0), 0));
  const totalOutput = totalPowder + totalWetOut;
  const avgEfficiency = totalInput > 0 ? (totalOutput / totalInput * 100) : 0;

  const showDryerFields = form.outputType !== 'wet';

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Processing</h1>
          <p className="text-sm text-gray-500 mt-1">Track drying and wet production output</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowModal(true); }}>
          Add Production
        </Button>
      </div>

      {/* Stats - 5 cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <StatsCard
          title="Avg Yield"
          value={`${avgEfficiency.toFixed(1)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Wet Input"
          value={`${totalInput.toFixed(1)} kg`}
          icon={<Factory className="w-5 h-5" />}
        />
        <StatsCard
          title="Wet Output"
          value={`${totalWetOut.toFixed(1)} kg`}
          icon={<Droplets className="w-5 h-5" />}
        />
        <StatsCard
          title="Powder Output"
          value={`${totalPowder.toFixed(1)} kg`}
          icon={<Package className="w-5 h-5" />}
        />
        <StatsCard
          title="Total Output"
          value={`${totalOutput.toFixed(1)} kg`}
          icon={<Factory className="w-5 h-5" />}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<Factory size={48} />}
          title="No production records"
          description="Add your first production record to start tracking"
          action={<Button onClick={() => setShowModal(true)}>Add Production</Button>}
        />
      ) : (
        <Card>
          <CardBody>
            <DataTable columns={columns} data={records} />
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add/Edit Production Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingItem ? 'Edit Production Record' : 'Add Production Record'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Production Date"
              type="date"
              value={form.productionDate}
              onChange={(e) => setForm({ ...form, productionDate: e.target.value })}
              required
            />
            <Select
              label="Output Type"
              options={outputTypeOptions}
              value={form.outputType}
              onChange={(e) => setForm({ ...form, outputType: e.target.value })}
            />
          </div>

          <Input
            label="Wet Input (kg) — Total harvested biomass"
            type="number"
            step="0.01"
            value={form.wetInputKg}
            onChange={(e) => setForm({ ...form, wetInputKg: e.target.value })}
            required
          />

          {/* Output fields based on type */}
          <div className="grid grid-cols-2 gap-4">
            {(form.outputType === 'wet' || form.outputType === 'both') && (
              <Input
                label="Wet Output (kg) — Direct sale to shrimp/fish"
                type="number"
                step="0.01"
                value={form.wetOutputKg}
                onChange={(e) => setForm({ ...form, wetOutputKg: e.target.value })}
                required={form.outputType === 'wet'}
              />
            )}
            {(form.outputType === 'powder' || form.outputType === 'both') && (
              <Input
                label="Powder Output (kg)"
                type="number"
                step="0.01"
                value={form.powderOutputKg}
                onChange={(e) => setForm({ ...form, powderOutputKg: e.target.value })}
                required={form.outputType === 'powder'}
              />
            )}
          </div>

          {/* Dryer fields — hidden for wet-only output */}
          {showDryerFields && (
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Dryer Type"
                options={dryerTypeOptions}
                value={form.dryerType}
                onChange={(e) => setForm({ ...form, dryerType: e.target.value })}
              />
              <Input
                label="Drying Duration (hours)"
                type="number"
                step="0.5"
                value={form.dryingTimeHours}
                onChange={(e) => setForm({ ...form, dryingTimeHours: e.target.value })}
              />
            </div>
          )}

          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="e.g. Sold 5kg wet to fish farm, dried rest..."
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Update Record' : 'Add Record'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
