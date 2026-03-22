import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, IndianRupee, Check, X, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, DataTable, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { expensesApi } from '../services/modules.api';

export default function ExpensesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: 'operations',
    amount: '',
    vendor: '',
    notes: '',
  });

  const filters: Record<string, unknown> = { page, limit: 20 };
  if (category) filters.category = category;
  if (status) filters.status = status;
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesApi.list(filters),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => expensesApi.create(data),
    onSuccess: () => {
      toast.success(t('expenses.expenseAdded'));
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('expenses.expenseAddFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => expensesApi.update(id, data),
    onSuccess: () => {
      toast.success(t('expenses.expenseUpdated'));
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('expenses.expenseUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      toast.success(t('expenses.expenseDeleted'));
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => toast.error(t('expenses.expenseDeleteFailed')),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => expensesApi.approve(id),
    onSuccess: () => {
      toast.success(t('expenses.expenseApproved'));
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => toast.error(t('expenses.expenseApproveFailed')),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => expensesApi.reject(id),
    onSuccess: () => {
      toast.success(t('expenses.expenseRejected'));
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => toast.error(t('expenses.expenseRejectFailed')),
  });

  const resetForm = () => {
    setEditingItem(null);
    setForm({ date: new Date().toISOString().split('T')[0], description: '', category: 'operations', amount: '', vendor: '', notes: '' });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      date: (item.date || item.createdAt)?.split('T')[0] || '',
      description: item.description || '',
      category: item.category || 'operations',
      amount: String(item.amount || ''),
      vendor: item.vendor || '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date: form.date,
      description: form.description,
      category: form.category,
      amount: Number(form.amount),
      vendor: form.vendor || undefined,
      notes: form.notes || undefined,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const expenses = data?.data ?? [];
  const pagination = data?.meta;

  const statusBadge = (s: string) => {
    const variants: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'danger',
    };
    return <Badge variant={variants[s] || 'default'}>{s}</Badge>;
  };

  const categoryOptions = [
    { value: 'operations', label: t('expenses.operations') },
    { value: 'chemicals', label: t('chemicals.chemicalsTab') },
    { value: 'equipment', label: t('expenses.equipmentCat') },
    { value: 'labor', label: t('expenses.labor') },
    { value: 'utilities', label: t('expenses.utilities') },
    { value: 'marketing', label: t('expenses.marketingCat') },
    { value: 'logistics', label: t('expenses.logistics') },
    { value: 'other', label: t('expenses.otherCat') },
  ];

  const columns = [
    { key: 'date', header: t('common.date'), render: (item: any) => new Date(item.date || item.createdAt).toLocaleDateString() },
    { key: 'description', header: t('common.description') },
    { key: 'category', header: t('common.category'), render: (item: any) => <span className="capitalize">{item.category}</span> },
    { key: 'amount', header: t('common.amount'), render: (item: any) => `₹${Number(item.amount).toLocaleString()}` },
    { key: 'vendor', header: t('expenses.vendor'), render: (item: any) => item.vendor || '-' },
    { key: 'status', header: t('common.status'), render: (item: any) => statusBadge(item.status || 'pending') },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: any) => (
        <div className="flex gap-1">
          {item.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" icon={<Check className="w-3 h-3 text-green-600" />} onClick={(e) => { e.stopPropagation(); approveMutation.mutate(item.id); }} />
              <Button size="sm" variant="ghost" icon={<X className="w-3 h-3 text-red-600" />} onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(item.id); }} />
            </>
          )}
          <Button size="sm" variant="ghost" icon={<Pencil className="w-3 h-3" />} onClick={(e) => { e.stopPropagation(); handleEdit(item); }} />
          <Button size="sm" variant="ghost" icon={<Trash2 className="w-3 h-3 text-red-500" />} onClick={(e) => { e.stopPropagation(); if (confirm(t('expenses.deleteExpense'))) deleteMutation.mutate(item.id); }} />
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('expenses.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('expenses.subtitle')}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowModal(true); }}>
          {t('expenses.addExpense')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <Select
              label={t('common.category')}
              options={categoryOptions}
              placeholder={t('expenses.allCategories')}
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            />
            <Select
              label={t('common.status')}
              options={[
                { value: 'pending', label: t('common.pending') },
                { value: 'approved', label: t('common.approved') },
                { value: 'rejected', label: t('common.rejected') },
              ]}
              placeholder={t('expenses.allStatus')}
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            />
            <Input label={t('harvest.startDate')} type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            <Input label={t('harvest.endDate')} type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            <Button variant="secondary" onClick={() => { setCategory(''); setStatus(''); setStartDate(''); setEndDate(''); setPage(1); }}>
              {t('common.clear')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={<IndianRupee size={48} />}
          title={t('expenses.noExpenses')}
          description={t('expenses.startTracking')}
          action={<Button onClick={() => setShowModal(true)}>{t('expenses.addExpense')}</Button>}
        />
      ) : (
        <Card>
          <CardBody>
            <DataTable columns={columns} data={expenses} />
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add Expense Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingItem ? t('expenses.editExpense') : t('expenses.addExpense')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t('common.date')} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label={t('common.description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('common.category')} options={categoryOptions} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label={t('expenses.expenseAmount')} type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <Input label={t('expenses.vendor')} value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <Input label={t('common.notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>{t('common.cancel')}</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingItem ? t('common.update') : t('expenses.addExpense')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
