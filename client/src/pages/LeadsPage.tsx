import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, UserPlus, LayoutGrid, List, Pencil, Trash2 } from 'lucide-react';
import { Button, Input, Select, Card, CardBody, CardTitle, DataTable, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { leadsApi } from '../services/modules.api';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: 'default' | 'info' | 'warning' | 'success' | 'danger' }> = {
  new: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'info' },
  contacted: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', badge: 'info' },
  qualified: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', badge: 'info' },
  proposal: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'warning' },
  negotiation: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', badge: 'warning' },
  won: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'success' },
  lost: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'danger' },
};

export default function LeadsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'pipeline' | 'table'>('pipeline');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [form, setForm] = useState({
    contactName: '',
    companyName: '',
    email: '',
    phone: '',
    source: 'website',
    estimatedValue: '',
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['leads', { page, limit: 100 }],
    queryFn: () => leadsApi.list({ page, limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => leadsApi.create(data),
    onSuccess: () => {
      toast.success(t('leads.leadAdded'));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('leads.leadAddFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => leadsApi.update(id, data),
    onSuccess: () => {
      toast.success(t('leads.leadUpdated'));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => toast.error(t('leads.leadUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => leadsApi.delete(id),
    onSuccess: () => {
      toast.success(t('leads.leadDeleted'));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => toast.error(t('leads.leadDeleteFailed')),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => leadsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success(t('leads.leadUpdated'));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => toast.error(t('leads.leadUpdateFailed')),
  });

  const convertMutation = useMutation({
    mutationFn: (id: number) => leadsApi.convert(id),
    onSuccess: () => {
      toast.success(t('leads.leadConverted'));
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => toast.error(t('leads.leadConvertFailed')),
  });

  const resetForm = () => {
    setForm({ contactName: '', companyName: '', email: '', phone: '', source: 'website', estimatedValue: '', notes: '' });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      contactName: item.contactName || '',
      companyName: item.companyName || '',
      email: item.email || '',
      phone: item.phone || '',
      source: item.source || 'website',
      estimatedValue: item.estimatedValue ? String(item.estimatedValue) : '',
      notes: item.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      contactName: form.contactName,
      companyName: form.companyName || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      source: form.source,
      estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
      notes: form.notes || undefined,
    };
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const leads = data?.data ?? [];

  const columns = [
    { key: 'contactName', header: t('leads.contact') },
    { key: 'companyName', header: t('customers.company'), render: (item: any) => item.companyName || '-' },
    { key: 'source', header: t('leads.source'), render: (item: any) => <span className="capitalize">{item.source}</span> },
    { key: 'estimatedValue', header: t('leads.value'), render: (item: any) => item.estimatedValue ? `₹${Number(item.estimatedValue).toLocaleString()}` : '-' },
    {
      key: 'status',
      header: t('common.status'),
      render: (item: any) => (
        <select
          value={item.status}
          onChange={(e) => { e.stopPropagation(); statusMutation.mutate({ id: item.id, status: e.target.value }); }}
          className="text-xs border rounded px-2 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (item: any) => (
        <div className="flex gap-1">
          <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title={t('common.edit')}>
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); if (confirm(t('leads.deleteLead'))) deleteMutation.mutate(item.id); }} className="p-1 text-red-600 hover:bg-red-50 rounded" title={t('common.delete')}>
            <Trash2 className="w-4 h-4" />
          </button>
          {item.status !== 'won' && item.status !== 'lost' && (
            <Button
              size="sm"
              variant="secondary"
              icon={<UserPlus className="w-3 h-3" />}
              onClick={(e) => { e.stopPropagation(); convertMutation.mutate(item.id); }}
            >
              {t('leads.convert')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  const pipelineView = (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {STATUSES.map((status) => {
        const statusLeads = leads.filter((l: any) => l.status === status);
        const config = STATUS_COLORS[status];
        return (
          <div key={status} className={`rounded-lg border p-3 min-h-[200px] ${config.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-xs font-semibold uppercase ${config.text}`}>{status}</h3>
              <Badge variant={config.badge}>{statusLeads.length}</Badge>
            </div>
            <div className="space-y-2">
              {statusLeads.map((lead: any) => (
                <div key={lead.id} className="bg-white rounded-lg p-3 shadow-sm border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{lead.contactName}</p>
                      {lead.companyName && <p className="text-xs text-gray-500 truncate">{lead.companyName}</p>}
                    </div>
                    <div className="flex gap-0.5 ml-1">
                      <button onClick={() => handleEdit(lead)} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded" title={t('common.edit')}>
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button onClick={() => { if (confirm(t('leads.deleteLead'))) deleteMutation.mutate(lead.id); }} className="p-0.5 text-red-600 hover:bg-red-50 rounded" title={t('common.delete')}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  {lead.estimatedValue && <p className="text-xs text-green-600 mt-1">₹{Number(lead.estimatedValue).toLocaleString()}</p>}
                  <div className="flex gap-1 mt-2">
                    <select
                      value={lead.status}
                      onChange={(e) => statusMutation.mutate({ id: lead.id, status: e.target.value })}
                      className="text-xs border rounded px-1 py-0.5 flex-1"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                    {lead.status !== 'won' && lead.status !== 'lost' && (
                      <button
                        onClick={() => convertMutation.mutate(lead.id)}
                        className="text-xs text-primary-600 hover:underline"
                        title={t('leads.convert')}
                      >
                        {t('leads.convert')}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('leads.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('leads.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              className={`px-3 py-2 text-sm ${view === 'pipeline' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              onClick={() => setView('pipeline')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-primary-600 text-white' : 'bg-white text-gray-600'}`}
              onClick={() => setView('table')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            {t('leads.addLead')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : leads.length === 0 ? (
        <EmptyState
          icon={<UserPlus size={48} />}
          title={t('leads.noLeads')}
          description={t('leads.buildPipeline')}
          action={<Button onClick={() => setShowModal(true)}>{t('leads.addLead')}</Button>}
        />
      ) : view === 'pipeline' ? (
        pipelineView
      ) : (
        <Card>
          <CardBody>
            <DataTable columns={columns} data={leads} />
          </CardBody>
        </Card>
      )}

      {/* Add/Edit Lead Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); resetForm(); }} title={editingItem ? t('leads.editLead') : t('leads.addLead')} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('leads.contactNameLabel')} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} required />
            <Input label={t('leads.companyNameLabel')} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('leads.emailLabel')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label={t('leads.phoneLabel')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('leads.sourceLabel')}
              options={[
                { value: 'website', label: t('leads.website') },
                { value: 'referral', label: t('leads.referral') },
                { value: 'cold-call', label: t('leads.coldCall') },
                { value: 'trade-show', label: t('leads.tradeShow') },
                { value: 'social-media', label: t('leads.socialMedia') },
                { value: 'other', label: t('leads.otherSource') },
              ]}
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            />
            <Input label={t('leads.estimatedValue')} type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
          </div>
          <Input label={t('leads.additionalNotes')} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('leads.additionalNotes')} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingItem(null); resetForm(); }}>{t('common.cancel')}</Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>{editingItem ? t('common.update') : t('leads.addLead')}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
