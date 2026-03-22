import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Search, Users, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, DataTable, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { customersApi } from '../services/modules.api';

export default function CustomersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [form, setForm] = useState({
    contactName: '',
    companyName: '',
    customerType: 'retail',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    creditLimitAmount: '',
  });

  const filters: Record<string, unknown> = { page, limit: 20 };
  if (search) filters.search = search;
  if (customerType) filters.customerType = customerType;

  const { data, isLoading } = useQuery({
    queryKey: ['customers', filters],
    queryFn: () => customersApi.list(filters),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => customersApi.create(data),
    onSuccess: () => {
      toast.success(t('customers.customerAdded'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('customers.customerAddFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => customersApi.update(id, data),
    onSuccess: () => {
      toast.success(t('customers.customerUpdated'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => toast.error(t('customers.customerUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.delete(id),
    onSuccess: () => {
      toast.success(t('customers.customerDeleted'));
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => toast.error(t('customers.customerDeleteFailed')),
  });

  const resetForm = () => {
    setForm({ contactName: '', companyName: '', customerType: 'retail', email: '', phone: '', address: '', gstNumber: '', creditLimitAmount: '' });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      contactName: item.contactName || '',
      companyName: item.companyName || '',
      customerType: item.customerType || 'retail',
      email: item.email || '',
      phone: item.phone || '',
      address: item.address || '',
      gstNumber: item.gstNumber || '',
      creditLimitAmount: item.creditLimitAmount ? String(item.creditLimitAmount) : '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      contactName: form.contactName,
      companyName: form.companyName || undefined,
      customerType: form.customerType,
      email: form.email || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
      gstNumber: form.gstNumber || undefined,
      creditLimitAmount: form.creditLimitAmount ? Number(form.creditLimitAmount) : undefined,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const customers = data?.data ?? [];
  const pagination = data?.meta;

  const columns = [
    { key: 'contactName', header: t('customers.contactName') },
    { key: 'companyName', header: t('customers.company'), render: (item: any) => item.companyName || '-' },
    {
      key: 'customerType',
      header: t('common.type'),
      render: (item: any) => <Badge variant={item.customerType === 'wholesale' ? 'info' : 'default'}>{item.customerType}</Badge>,
    },
    { key: 'email', header: t('common.email'), render: (item: any) => item.email || '-' },
    { key: 'phone', header: t('common.phone'), render: (item: any) => item.phone || '-' },
    {
      key: 'outstandingAmount',
      header: t('customers.outstanding'),
      render: (item: any) => {
        const amt = Number(item.outstandingAmount || 0);
        return <span className={amt > 0 ? 'text-red-600 font-medium' : ''}>₹{amt.toLocaleString()}</span>;
      },
    },
    {
      key: 'status',
      header: t('common.status'),
      render: (item: any) => <Badge variant={item.status === 'active' ? 'success' : 'default'}>{item.status || 'active'}</Badge>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: any) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title={t('common.edit')}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm(t('customers.deleteCustomer'))) deleteMutation.mutate(item.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title={t('common.delete')}>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('customers.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('customers.subtitle')}</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          {t('customers.addCustomer')}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('customers.searchCustomers')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <Select
          options={[
            { value: 'retail', label: t('customers.retail') },
            { value: 'wholesale', label: t('customers.wholesale') },
            { value: 'distributor', label: t('customers.distributor') },
            { value: 'institutional', label: t('customers.institutional') },
          ]}
          placeholder={t('customers.allTypes')}
          value={customerType}
          onChange={(e) => { setCustomerType(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <PageLoader />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Users size={48} />}
          title={t('customers.noCustomers')}
          description={t('customers.addFirstCustomer')}
          action={<Button onClick={() => setShowModal(true)}>{t('customers.addCustomer')}</Button>}
        />
      ) : (
        <Card>
          <CardBody>
            <DataTable
              columns={columns}
              data={customers}
              onRowClick={(item: any) => navigate(`/customers/${item.id}`)}
            />
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Add/Edit Customer Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); resetForm(); }} title={editingItem ? t('customers.editCustomer') : t('customers.addCustomer')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('customers.contactName')} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
            <Input label={t('customers.companyName')} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <Select
            label={t('customers.customerType')}
            options={[
              { value: 'retail', label: t('customers.retail') },
              { value: 'wholesale', label: t('customers.wholesale') },
              { value: 'distributor', label: t('customers.distributor') },
              { value: 'institutional', label: t('customers.institutional') },
            ]}
            value={form.customerType}
            onChange={(e) => setForm({ ...form, customerType: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('common.email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label={t('common.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label={t('common.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('customers.gstNumber')} value={form.gstNumber} onChange={(e) => setForm({ ...form, gstNumber: e.target.value })} />
            <Input label={t('customers.creditLimit')} type="number" value={form.creditLimitAmount} onChange={(e) => setForm({ ...form, creditLimitAmount: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }}>{t('common.cancel')}</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingItem ? t('common.update') : t('customers.addCustomer')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
