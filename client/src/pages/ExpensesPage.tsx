import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, IndianRupee, Check, X, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, DataTable, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { expensesApi } from '../services/modules.api';

export default function ExpensesPage() {
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
      toast.success('Expense added');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to add expense'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => expensesApi.update(id, data),
    onSuccess: () => {
      toast.success('Expense updated');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to update expense'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      toast.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => toast.error('Failed to delete expense'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => expensesApi.approve(id),
    onSuccess: () => {
      toast.success('Expense approved');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => toast.error('Failed to approve expense'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => expensesApi.reject(id),
    onSuccess: () => {
      toast.success('Expense rejected');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: () => toast.error('Failed to reject expense'),
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

  const columns = [
    { key: 'date', header: 'Date', render: (item: any) => new Date(item.date || item.createdAt).toLocaleDateString() },
    { key: 'description', header: 'Description' },
    { key: 'category', header: 'Category', render: (item: any) => <span className="capitalize">{item.category}</span> },
    { key: 'amount', header: 'Amount', render: (item: any) => `₹${Number(item.amount).toLocaleString()}` },
    { key: 'vendor', header: 'Vendor', render: (item: any) => item.vendor || '-' },
    { key: 'status', header: 'Status', render: (item: any) => statusBadge(item.status || 'pending') },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex gap-1">
          {item.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" icon={<Check className="w-3 h-3 text-green-600" />} onClick={(e) => { e.stopPropagation(); approveMutation.mutate(item.id); }} />
              <Button size="sm" variant="ghost" icon={<X className="w-3 h-3 text-red-600" />} onClick={(e) => { e.stopPropagation(); rejectMutation.mutate(item.id); }} />
            </>
          )}
          <Button size="sm" variant="ghost" icon={<Pencil className="w-3 h-3" />} onClick={(e) => { e.stopPropagation(); handleEdit(item); }} />
          <Button size="sm" variant="ghost" icon={<Trash2 className="w-3 h-3 text-red-500" />} onClick={(e) => { e.stopPropagation(); if (confirm('Delete this expense?')) deleteMutation.mutate(item.id); }} />
        </div>
      ),
    },
  ];

  const categoryOptions = [
    { value: 'operations', label: 'Operations' },
    { value: 'chemicals', label: 'Chemicals' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'labor', label: 'Labor' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage all expenses</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { resetForm(); setShowModal(true); }}>
          Add Expense
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <Select
              label="Category"
              options={categoryOptions}
              placeholder="All Categories"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            />
            <Select
              label="Status"
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
              placeholder="All Status"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            />
            <Input label="Start Date" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
            <Input label="End Date" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
            <Button variant="secondary" onClick={() => { setCategory(''); setStatus(''); setStartDate(''); setEndDate(''); setPage(1); }}>
              Clear
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
          title="No expenses found"
          description="Start tracking your expenses"
          action={<Button onClick={() => setShowModal(true)}>Add Expense</Button>}
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
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingItem ? 'Edit Expense' : 'Add Expense'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" options={categoryOptions} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input label="Amount (₹)" type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          <Input label="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingItem ? 'Update Expense' : 'Add Expense'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
