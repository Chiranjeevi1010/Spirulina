import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, ShoppingCart, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, DataTable, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { ordersApi, customersApi } from '../services/modules.api';

export default function OrdersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [form, setForm] = useState({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    items: [{ productType: 'powder', quantity: '', unitPrice: '', description: 'Spirulina Powder' }],
    notes: '',
  });

  const filters: Record<string, unknown> = { page, limit: 20 };
  if (statusFilter) filters.status = statusFilter;
  if (paymentFilter) filters.paymentStatus = paymentFilter;

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => ordersApi.list(filters),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => ordersApi.create(data),
    onSuccess: () => {
      toast.success(t('orders.orderCreated'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('orders.orderCreateFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => ordersApi.update(id, data),
    onSuccess: () => {
      toast.success(t('orders.orderUpdated'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => toast.error(t('orders.orderUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => ordersApi.delete(id),
    onSuccess: () => {
      toast.success(t('orders.orderDeleted'));
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: () => toast.error(t('orders.orderDeleteFailed')),
  });

  const resetForm = () => {
    setForm({
      customerId: '',
      orderDate: new Date().toISOString().split('T')[0],
      items: [{ productType: 'powder', quantity: '', unitPrice: '', description: 'Spirulina Powder' }],
      notes: '',
    });
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { productType: 'powder', quantity: '', unitPrice: '', description: '' }],
    });
  };

  const removeItem = (idx: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const updateItem = (idx: number, field: string, value: string) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    setForm({ ...form, items });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      customerId: item.customerId ? String(item.customerId) : '',
      orderDate: item.orderDate ? new Date(item.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: item.items && item.items.length > 0
        ? item.items.map((i: any) => ({
            productType: i.productType || 'powder',
            quantity: i.quantity ? String(i.quantity) : '',
            unitPrice: i.unitPrice ? String(i.unitPrice) : '',
            description: i.description || '',
          }))
        : [{ productType: 'powder', quantity: '', unitPrice: '', description: '' }],
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
    const payload = {
      customerId: Number(form.customerId),
      orderDate: form.orderDate,
      totalAmount,
      items: form.items.map((item) => ({
        productType: item.productType,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        description: item.description || undefined,
      })),
      notes: form.notes || undefined,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const orders = data?.data ?? [];
  const pagination = data?.meta;
  const customerOptions = (customers?.data ?? []).map((c: any) => ({
    value: String(c.id),
    label: c.contactName + (c.companyName ? ` (${c.companyName})` : ''),
  }));

  const columns = [
    { key: 'orderNumber', header: t('orders.orderNumber'), render: (item: any) => item.orderNumber || `#${item.id}` },
    { key: 'customer', header: t('orders.customer'), render: (item: any) => item.customer?.contactName || `Customer #${item.customerId}` },
    { key: 'orderDate', header: t('common.date'), render: (item: any) => new Date(item.orderDate || item.createdAt).toLocaleDateString() },
    { key: 'totalAmount', header: t('orders.totalAmount'), render: (item: any) => `₹${Number(item.totalAmount || 0).toLocaleString()}` },
    {
      key: 'paymentStatus',
      header: t('orders.payment'),
      render: (item: any) => {
        const v: Record<string, 'success' | 'warning' | 'danger' | 'default'> = { paid: 'success', partial: 'warning', unpaid: 'danger' };
        return <Badge variant={v[item.paymentStatus] || 'default'}>{item.paymentStatus || 'unpaid'}</Badge>;
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (item: any) => {
        const v: Record<string, 'success' | 'warning' | 'info' | 'danger' | 'default'> = {
          pending: 'warning', confirmed: 'info', processing: 'info', shipped: 'info', delivered: 'success', cancelled: 'danger',
        };
        return <Badge variant={v[item.status] || 'default'}>{item.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: any) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title={t('common.edit')}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm(t('orders.deleteOrder'))) deleteMutation.mutate(item.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title={t('common.delete')}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('orders.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('orders.subtitle')}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          {t('orders.newOrder')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          options={[
            { value: 'pending', label: t('common.pending') },
            { value: 'confirmed', label: t('orders.confirmed') },
            { value: 'processing', label: t('orders.processing') },
            { value: 'shipped', label: t('orders.shipped') },
            { value: 'delivered', label: t('orders.delivered') },
            { value: 'cancelled', label: t('orders.cancelled') },
          ]}
          placeholder={t('expenses.allStatus')}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        />
        <Select
          options={[
            { value: 'unpaid', label: t('orders.unpaid') },
            { value: 'partial', label: t('orders.partial') },
            { value: 'paid', label: t('orders.paid') },
          ]}
          placeholder={t('orders.allPayments')}
          value={paymentFilter}
          onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
        />
        <Button variant="secondary" onClick={() => { setStatusFilter(''); setPaymentFilter(''); setPage(1); }}>
          {t('common.clear')}
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart size={48} />}
          title={t('orders.noOrders')}
          description={t('orders.createFirstOrder')}
          action={<Button onClick={() => setShowModal(true)}>{t('orders.newOrder')}</Button>}
        />
      ) : (
        <Card>
          <CardBody>
            <DataTable
              columns={columns}
              data={orders}
              onRowClick={(item: any) => navigate(`/orders/${item.id}`)}
            />
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add/Edit Order Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); resetForm(); }} title={editingItem ? t('orders.editOrder') : t('orders.newOrder')} size="xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('orders.customer')}
              options={customerOptions}
              placeholder={t('orders.selectCustomer')}
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            />
            <Input
              label={t('orders.orderDate')}
              type="date"
              value={form.orderDate}
              onChange={(e) => setForm({ ...form, orderDate: e.target.value })}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">{t('orders.orderItems')}</label>
              <Button type="button" variant="ghost" size="sm" icon={<Plus className="w-3 h-3" />} onClick={addItem}>
                {t('orders.addItem')}
              </Button>
            </div>
            {form.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                <div className="col-span-3">
                  <Select
                    options={[
                      { value: 'powder', label: t('inventory.powderProduct') },
                      { value: 'tablets', label: t('inventory.tablets') },
                      { value: 'capsules', label: t('inventory.capsules') },
                      { value: 'flakes', label: t('inventory.flakes') },
                      { value: 'extract', label: t('inventory.extract') },
                    ]}
                    value={item.productType}
                    onChange={(e) => updateItem(idx, 'productType', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder={t('common.description')}
                    value={item.description}
                    onChange={(e) => updateItem(idx, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder={t('orders.qty')}
                    step="0.1"
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    placeholder={t('orders.pricePerUnit')}
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                    required
                  />
                </div>
                <div className="col-span-1 text-sm text-gray-600 text-right">
                  ₹{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString()}
                </div>
                <div className="col-span-1">
                  {form.items.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)}>
                      X
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <div className="text-right text-sm font-semibold mt-2">
              {t('common.total')}: ₹{form.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0).toLocaleString()}
            </div>
          </div>

          <Input label={t('common.notes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes..." />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }}>{t('common.cancel')}</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingItem ? t('common.update') : t('common.create')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
