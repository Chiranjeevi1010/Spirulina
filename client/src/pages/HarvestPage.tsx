import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Scissors, Calendar, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, DataTable, Modal, Pagination, PageLoader, EmptyState, StatsCard } from '../components/ui';
import { harvestApi } from '../services/modules.api';
import { pondsApi } from '../services/ponds.api';

export default function HarvestPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [form, setForm] = useState({
    pondId: '',
    harvestDate: new Date().toISOString().split('T')[0],
    wetHarvestKg: '',
    solidsPercentage: '',
    dryYieldPercentage: '',
    harvestMethod: 'filtration',
    notes: '',
  });

  const filters: Record<string, unknown> = { page, limit: 20 };
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const { data, isLoading } = useQuery({
    queryKey: ['harvests', filters],
    queryFn: () => harvestApi.list(filters),
  });

  const { data: ponds } = useQuery({
    queryKey: ['ponds-list'],
    queryFn: () => pondsApi.list({ limit: 100 }),
  });

  const { data: stats } = useQuery({
    queryKey: ['harvest-stats', startDate, endDate],
    queryFn: () => harvestApi.getStats({ startDate: startDate || undefined, endDate: endDate || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => harvestApi.create(data),
    onSuccess: () => {
      toast.success(t('harvest.harvestAdded'));
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-stats'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('harvest.harvestAddFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => harvestApi.update(id, data),
    onSuccess: () => {
      toast.success(t('harvest.harvestUpdated'));
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-stats'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('harvest.harvestUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => harvestApi.delete(id),
    onSuccess: () => {
      toast.success(t('harvest.harvestDeleted'));
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
      queryClient.invalidateQueries({ queryKey: ['harvest-stats'] });
    },
    onError: () => toast.error(t('harvest.harvestDeleteFailed')),
  });

  const resetForm = () => {
    setEditingItem(null);
    setForm({
      pondId: '',
      harvestDate: new Date().toISOString().split('T')[0],
      wetHarvestKg: '',
      solidsPercentage: '',
      dryYieldPercentage: '',
      harvestMethod: 'filtration',
      notes: '',
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      pondId: String(item.pondId),
      harvestDate: item.harvestDate?.split('T')[0] || '',
      wetHarvestKg: String(item.wetHarvestKg || ''),
      solidsPercentage: item.solidsPercentage ? String(item.solidsPercentage) : '',
      dryYieldPercentage: item.dryYieldPercentage ? String(item.dryYieldPercentage) : '',
      harvestMethod: item.harvestMethod || 'filtration',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      pondId: Number(form.pondId),
      harvestDate: form.harvestDate,
      wetHarvestKg: Number(form.wetHarvestKg),
      solidsPercentage: form.solidsPercentage ? Number(form.solidsPercentage) : undefined,
      dryYieldPercentage: form.dryYieldPercentage ? Number(form.dryYieldPercentage) : undefined,
      harvestMethod: form.harvestMethod,
      notes: form.notes || undefined,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const harvests = data?.data ?? [];
  const pagination = data?.meta;

  const columns = [
    {
      key: 'harvestDate',
      header: t('common.date'),
      render: (item: any) => new Date(item.harvestDate).toLocaleDateString(),
    },
    {
      key: 'pondId',
      header: t('harvest.pond'),
      render: (item: any) => item.pond?.name || `Pond #${item.pondId}`,
    },
    {
      key: 'wetHarvestKg',
      header: t('harvest.wetHarvestKg'),
      render: (item: any) => Number(item.wetHarvestKg).toFixed(2),
    },
    {
      key: 'solidsPercentage',
      header: t('harvest.solidsPercent'),
      render: (item: any) => item.solidsPercentage ? `${Number(item.solidsPercentage).toFixed(1)}%` : '-',
    },
    {
      key: 'harvestMethod',
      header: t('harvest.method'),
      render: (item: any) => (
        <span className="capitalize">{item.harvestMethod || '-'}</span>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: any) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" icon={<Pencil className="w-3 h-3" />} onClick={(e) => { e.stopPropagation(); handleEdit(item); }} />
          <Button size="sm" variant="ghost" icon={<Trash2 className="w-3 h-3 text-red-500" />} onClick={(e) => { e.stopPropagation(); if (confirm(t('harvest.harvestDeleted'))) deleteMutation.mutate(item.id); }} />
        </div>
      ),
    },
  ];

  const pondOptions = (ponds?.data ?? []).map((p: any) => ({
    value: String(p.id),
    label: p.name,
  }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('harvest.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('harvest.subtitle')}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowModal(true); }}>
          {t('harvest.addHarvest')}
        </Button>
      </div>

      {/* Stats */}
      {stats != null && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatsCard title={t('harvest.totalHarvests')} value={String((stats as Record<string, unknown>).harvestCount ?? 0)} icon={<Scissors className="w-5 h-5" />} />
          <StatsCard title={t('harvest.totalWetHarvest')} value={`${Number((stats as Record<string, unknown>).totalWetHarvestKg ?? 0).toFixed(1)} kg`} icon={<Scissors className="w-5 h-5" />} />
          <StatsCard title={t('harvest.avgPerHarvest')} value={`${Number((stats as Record<string, unknown>).avgWetPerHarvest ?? 0).toFixed(1)} kg`} icon={<Scissors className="w-5 h-5" />} />
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <Input
              label={t('harvest.startDate')}
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
            <Input
              label={t('harvest.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
            <Button
              variant="secondary"
              onClick={() => { setStartDate(''); setEndDate(''); setPage(1); }}
            >
              {t('common.clear')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : harvests.length === 0 ? (
        <EmptyState
          icon={<Scissors size={48} />}
          title={t('harvest.noHarvests')}
          description={t('harvest.addFirstHarvest')}
          action={<Button onClick={() => setShowModal(true)}>{t('harvest.addHarvest')}</Button>}
        />
      ) : (
        <Card>
          <CardBody>
            <DataTable columns={columns} data={harvests} />
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add Harvest Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingItem ? t('harvest.editHarvestRecord') : t('harvest.addHarvestRecord')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label={t('harvest.pond')}
            options={pondOptions}
            placeholder={t('harvest.pond')}
            value={form.pondId}
            onChange={(e) => setForm({ ...form, pondId: e.target.value })}
            required
          />
          <Input
            label={t('harvest.harvestDate')}
            type="date"
            value={form.harvestDate}
            onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('harvest.wetHarvestKg')}
              type="number"
              step="0.01"
              value={form.wetHarvestKg}
              onChange={(e) => setForm({ ...form, wetHarvestKg: e.target.value })}
              required
            />
            <Input
              label={t('harvest.solidsPercent')}
              type="number"
              step="0.1"
              value={form.solidsPercentage}
              onChange={(e) => setForm({ ...form, solidsPercentage: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('harvest.dryYieldPercent')}
              type="number"
              step="0.1"
              value={form.dryYieldPercentage}
              onChange={(e) => setForm({ ...form, dryYieldPercentage: e.target.value })}
            />
            <Select
              label={t('harvest.harvestMethod')}
              options={[
                { value: 'filtration', label: t('harvest.filtration') },
                { value: 'centrifuge', label: t('harvest.centrifuge') },
                { value: 'gravity', label: t('harvest.gravity') },
              ]}
              value={form.harvestMethod}
              onChange={(e) => setForm({ ...form, harvestMethod: e.target.value })}
            />
          </div>
          <Input
            label={t('common.notes')}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Optional notes..."
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? t('common.update') : t('harvest.addHarvest')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
