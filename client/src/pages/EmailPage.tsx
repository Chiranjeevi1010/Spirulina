import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Send, FileText, Clock, Plus, Trash2, Pencil } from 'lucide-react';
import { Button, Input, Card, CardBody, Select, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { emailApi } from '../services/modules.api';

type Tab = 'compose' | 'templates' | 'log';

export default function EmailPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('compose');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('emailModule.title')}</h1>
          <p className="text-sm text-gray-500">{t('emailModule.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <EmailStats />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {([
            { key: 'compose', label: t('emailModule.compose'), icon: <Send size={16} /> },
            { key: 'templates', label: t('emailModule.templates'), icon: <FileText size={16} /> },
            { key: 'log', label: t('emailModule.sentLog'), icon: <Clock size={16} /> },
          ] as const).map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                tab === tb.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'compose' && <ComposeTab />}
      {tab === 'templates' && <TemplatesTab />}
      {tab === 'log' && <LogTab />}
    </div>
  );
}

function EmailStats() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['email-stats'],
    queryFn: () => emailApi.getStats(),
  });

  const s = data as any;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-blue-700">{s?.sentToday ?? 0}</p>
        <p className="text-xs text-gray-500">{t('emailModule.sentToday')}</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-green-700">{s?.remainingToday ?? 20}</p>
        <p className="text-xs text-gray-500">{t('emailModule.remainingToday')}</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-red-700">{s?.failedToday ?? 0}</p>
        <p className="text-xs text-gray-500">{t('emailModule.failedToday')}</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-gray-700">{s?.totalSent ?? 0}</p>
        <p className="text-xs text-gray-500">{t('emailModule.totalSent')}</p>
      </CardBody></Card>
    </div>
  );
}

function ComposeTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    recipientEmail: '',
    recipientName: '',
    subject: '',
    body: '',
    templateId: '',
  });

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => emailApi.listTemplates(),
  });

  const sendMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => emailApi.send(data),
    onSuccess: () => {
      toast.success(t('emailModule.emailSent'));
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      queryClient.invalidateQueries({ queryKey: ['email-log'] });
      setForm({ recipientEmail: '', recipientName: '', subject: '', body: '', templateId: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || t('emailModule.emailSendFailed')),
  });

  const handleTemplateSelect = (templateId: string) => {
    setForm((f) => ({ ...f, templateId }));
    if (templateId) {
      const tpl = (templates as any[])?.find((t: any) => t.id === Number(templateId));
      if (tpl) {
        setForm((f) => ({ ...f, subject: tpl.subject, body: tpl.body }));
      }
    }
  };

  const handleSend = () => {
    if (!form.recipientEmail) return toast.error(t('common.required'));
    if (!form.subject) return toast.error(t('common.required'));
    if (!form.body) return toast.error(t('common.required'));

    sendMutation.mutate({
      recipientEmail: form.recipientEmail,
      recipientName: form.recipientName || undefined,
      subject: form.subject,
      body: form.body,
      templateId: form.templateId ? Number(form.templateId) : undefined,
    });
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={`${t('emailModule.recipientEmail')} *`}
            type="email"
            value={form.recipientEmail}
            onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
            placeholder="email@company.com"
          />
          <Input
            label={t('emailModule.recipientName')}
            value={form.recipientName}
            onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
            placeholder="John Doe"
          />
        </div>
        <Select
          label={`${t('emailModule.useTemplate')} (${t('common.optional')})`}
          value={form.templateId}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          options={[
            { value: '', label: t('emailModule.noTemplate') },
            ...((templates as any[]) || []).map((tpl: any) => ({
              value: String(tpl.id),
              label: `${tpl.templateName} (${tpl.category})`,
            })),
          ]}
        />
        <Input
          label={`${t('emailModule.subjectLabel')} *`}
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Introduction - Premium Spirulina Products"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailModule.bodyLabel')} *</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={10}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder={t('emailModule.bodyPlaceholder')}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSend} loading={sendMutation.isPending} icon={<Send size={16} />}>
            {t('emailModule.sendEmailBtn')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function TemplatesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState({ templateName: '', subject: '', body: '', category: 'general' });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => emailApi.listTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => emailApi.createTemplate(data),
    onSuccess: () => {
      toast.success(t('emailModule.templateCreated'));
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error(t('emailModule.templateCreateFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => emailApi.updateTemplate(id, data),
    onSuccess: () => {
      toast.success(t('emailModule.templateUpdated'));
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => toast.error(t('emailModule.templateUpdateFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emailApi.deleteTemplate(id),
    onSuccess: () => {
      toast.success(t('emailModule.templateDeleted'));
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: () => toast.error(t('emailModule.templateDeleteFailed')),
  });

  const resetForm = () => setForm({ templateName: '', subject: '', body: '', category: 'general' });

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm({ templateName: item.templateName, subject: item.subject, body: item.body, category: item.category });
    setShowModal(true);
  };

  const handleSave = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  if (isLoading) return <PageLoader />;

  const items = (templates as any[]) || [];

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }} icon={<Plus size={16} />}>
          {t('emailModule.newTemplate')}
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title={t('emailModule.noTemplates')}
          description={t('emailModule.createTemplates')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((tpl: any) => (
            <Card key={tpl.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{tpl.templateName}</h3>
                    <Badge variant="info">{tpl.category}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(tpl)} className="p-1 text-gray-400 hover:text-gray-600"><Pencil size={14} /></button>
                    <button onClick={() => deleteMutation.mutate(tpl.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-1"><strong>{t('emailModule.subjectLabel')}:</strong> {tpl.subject}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{tpl.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); }} title={editingItem ? t('emailModule.editTemplate') : t('emailModule.newTemplate')}>
        <div className="space-y-4">
          <Input label={`${t('emailModule.templateName')} *`} value={form.templateName} onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))} />
          <Select
            label={t('common.category')}
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={[
              { value: 'general', label: t('emailModule.general') },
              { value: 'nutraceuticals', label: t('emailModule.nutraceuticalsCat') },
              { value: 'poultry', label: t('emailModule.poultryCat') },
              { value: 'aquaculture', label: t('emailModule.aquacultureCat') },
              { value: 'follow_up', label: t('emailModule.followUpCat') },
            ]}
          />
          <Input label={`${t('emailModule.subjectLabel')} *`} value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('emailModule.bodyLabel')} *</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={8}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Use {{contactName}}, {{companyName}} as placeholders"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingItem(null); }}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} loading={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function LogTab() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['email-log', { page }],
    queryFn: () => emailApi.getLog({ page, limit: 20 }),
  });

  if (isLoading) return <PageLoader />;

  const items = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const STATUS_BADGE: Record<string, 'success' | 'danger' | 'warning'> = {
    sent: 'success',
    failed: 'danger',
    queued: 'warning',
  };

  return (
    <>
      {items.length === 0 ? (
        <EmptyState icon={<Mail size={48} />} title={t('emailModule.noEmailsSent')} description={t('emailModule.sendFirstEmail')} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('emailModule.recipient')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('emailModule.subject')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('settings.sentAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.recipientName || '-'}</div>
                      <div className="text-xs text-gray-400">{item.recipientEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{item.subject}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[item.status] || 'default'}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {item.sentAt ? new Date(item.sentAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {meta && meta.totalPages > 1 && (
        <Pagination currentPage={page} totalPages={meta.totalPages} onPageChange={setPage} />
      )}
    </>
  );
}
