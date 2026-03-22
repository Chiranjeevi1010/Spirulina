import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Mail, Send, FileText, Clock, Plus, Trash2, Pencil } from 'lucide-react';
import { Button, Input, Card, CardBody, Select, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { emailApi } from '../services/modules.api';

type Tab = 'compose' | 'templates' | 'log';

export default function EmailPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('compose');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Outreach</h1>
          <p className="text-sm text-gray-500">Send emails to leads and customers</p>
        </div>
      </div>

      {/* Stats */}
      <EmailStats />

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {([
            { key: 'compose', label: 'Compose', icon: <Send size={16} /> },
            { key: 'templates', label: 'Templates', icon: <FileText size={16} /> },
            { key: 'log', label: 'Sent Log', icon: <Clock size={16} /> },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon} {t.label}
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
  const { data } = useQuery({
    queryKey: ['email-stats'],
    queryFn: () => emailApi.getStats(),
  });

  const s = data as any;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-blue-700">{s?.sentToday ?? 0}</p>
        <p className="text-xs text-gray-500">Sent Today</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-green-700">{s?.remainingToday ?? 20}</p>
        <p className="text-xs text-gray-500">Remaining Today</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-red-700">{s?.failedToday ?? 0}</p>
        <p className="text-xs text-gray-500">Failed Today</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-gray-700">{s?.totalSent ?? 0}</p>
        <p className="text-xs text-gray-500">Total Sent</p>
      </CardBody></Card>
    </div>
  );
}

function ComposeTab() {
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
      toast.success('Email sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['email-stats'] });
      queryClient.invalidateQueries({ queryKey: ['email-log'] });
      setForm({ recipientEmail: '', recipientName: '', subject: '', body: '', templateId: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to send email'),
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
    if (!form.recipientEmail) return toast.error('Recipient email is required');
    if (!form.subject) return toast.error('Subject is required');
    if (!form.body) return toast.error('Body is required');

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
            label="Recipient Email *"
            type="email"
            value={form.recipientEmail}
            onChange={(e) => setForm((f) => ({ ...f, recipientEmail: e.target.value }))}
            placeholder="email@company.com"
          />
          <Input
            label="Recipient Name"
            value={form.recipientName}
            onChange={(e) => setForm((f) => ({ ...f, recipientName: e.target.value }))}
            placeholder="John Doe"
          />
        </div>
        <Select
          label="Use Template (optional)"
          value={form.templateId}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          options={[
            { value: '', label: 'No template - write custom' },
            ...((templates as any[]) || []).map((t: any) => ({
              value: String(t.id),
              label: `${t.templateName} (${t.category})`,
            })),
          ]}
        />
        <Input
          label="Subject *"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Introduction - Premium Spirulina Products"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={10}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Write your email body here... Use {{contactName}}, {{companyName}} as placeholders."
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSend} loading={sendMutation.isPending} icon={<Send size={16} />}>
            Send Email
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function TemplatesTab() {
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
      toast.success('Template created');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowModal(false);
      resetForm();
    },
    onError: () => toast.error('Failed to create template'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => emailApi.updateTemplate(id, data),
    onSuccess: () => {
      toast.success('Template updated');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setShowModal(false);
      setEditingItem(null);
      resetForm();
    },
    onError: () => toast.error('Failed to update template'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => emailApi.deleteTemplate(id),
    onSuccess: () => {
      toast.success('Template deleted');
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
    },
    onError: () => toast.error('Failed to delete template'),
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
          New Template
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<FileText size={48} />}
          title="No templates yet"
          description="Create email templates for quick outreach."
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
                <p className="text-sm text-gray-600 mb-1"><strong>Subject:</strong> {tpl.subject}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{tpl.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingItem(null); }} title={editingItem ? 'Edit Template' : 'New Template'}>
        <div className="space-y-4">
          <Input label="Template Name *" value={form.templateName} onChange={(e) => setForm((f) => ({ ...f, templateName: e.target.value }))} />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            options={[
              { value: 'general', label: 'General' },
              { value: 'nutraceuticals', label: 'Nutraceuticals' },
              { value: 'poultry', label: 'Poultry' },
              { value: 'aquaculture', label: 'Aquaculture' },
              { value: 'follow_up', label: 'Follow-up' },
            ]}
          />
          <Input label="Subject *" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body *</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              rows={8}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Use {{contactName}}, {{companyName}} as placeholders"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditingItem(null); }}>Cancel</Button>
            <Button onClick={handleSave} loading={createMutation.isPending || updateMutation.isPending}>
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function LogTab() {
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
        <EmptyState icon={<Mail size={48} />} title="No emails sent yet" description="Send your first email from the Compose tab." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sent At</th>
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
