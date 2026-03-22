import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Phone, PhoneOutgoing, PhoneIncoming, Plus, CheckCircle, BarChart3 } from 'lucide-react';
import { Button, Input, Card, CardBody, Select, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { callTrackerApi } from '../services/modules.api';

type Tab = 'log' | 'history' | 'analytics';

export default function CallTrackerPage() {
  const [tab, setTab] = useState<Tab>('log');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Tracker</h1>
          <p className="text-sm text-gray-500">Log calls and track follow-ups</p>
        </div>
      </div>

      <CallStats />

      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {([
            { key: 'log', label: 'Log Call', icon: <Plus size={16} /> },
            { key: 'history', label: 'History', icon: <Phone size={16} /> },
            { key: 'analytics', label: 'Analytics', icon: <BarChart3 size={16} /> },
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

      {tab === 'log' && <LogCallTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

function CallStats() {
  const { data } = useQuery({
    queryKey: ['call-stats'],
    queryFn: () => callTrackerApi.getStats(),
  });

  const { data: target } = useQuery({
    queryKey: ['call-daily-target'],
    queryFn: () => callTrackerApi.getDailyTarget(),
  });

  const s = data as any;
  const t = target as any;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-green-700">{t?.made ?? 0} / {t?.target ?? 20}</p>
        <p className="text-xs text-gray-500">Calls Today</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-blue-700">{t?.remaining ?? 20}</p>
        <p className="text-xs text-gray-500">Remaining Today</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-purple-700">{s?.callsThisWeek ?? 0}</p>
        <p className="text-xs text-gray-500">This Week</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <div className="flex flex-wrap justify-center gap-1">
          {(s?.byOutcome || []).slice(0, 3).map((o: any) => (
            <span key={o.outcome} className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{o.outcome}: {o.count}</span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">Outcomes</p>
      </CardBody></Card>
    </div>
  );
}

function LogCallTab() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    callDate: today,
    callTime: '',
    duration: '',
    callType: 'outgoing',
    outcome: 'connected',
    notes: '',
    followUpDate: '',
    followUpNotes: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => callTrackerApi.create(data),
    onSuccess: () => {
      toast.success('Call logged!');
      queryClient.invalidateQueries({ queryKey: ['call-tracker'] });
      queryClient.invalidateQueries({ queryKey: ['call-stats'] });
      queryClient.invalidateQueries({ queryKey: ['call-daily-target'] });
      queryClient.invalidateQueries({ queryKey: ['crm-dashboard'] });
      setForm({
        callDate: today,
        callTime: '',
        duration: '',
        callType: 'outgoing',
        outcome: 'connected',
        notes: '',
        followUpDate: '',
        followUpNotes: '',
      });
    },
    onError: () => toast.error('Failed to log call'),
  });

  const handleSubmit = () => {
    createMutation.mutate({
      callDate: form.callDate,
      callTime: form.callTime || undefined,
      duration: form.duration ? Number(form.duration) : undefined,
      callType: form.callType,
      outcome: form.outcome,
      notes: form.notes || undefined,
      followUpDate: form.followUpDate || undefined,
      followUpNotes: form.followUpNotes || undefined,
    });
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Call Date *" type="date" value={form.callDate} onChange={(e) => setForm((f) => ({ ...f, callDate: e.target.value }))} />
          <Input label="Call Time" type="time" value={form.callTime} onChange={(e) => setForm((f) => ({ ...f, callTime: e.target.value }))} />
          <Input label="Duration (minutes)" type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Call Type *"
            value={form.callType}
            onChange={(e) => setForm((f) => ({ ...f, callType: e.target.value }))}
            options={[
              { value: 'outgoing', label: 'Outgoing' },
              { value: 'incoming', label: 'Incoming' },
            ]}
          />
          <Select
            label="Outcome *"
            value={form.outcome}
            onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
            options={[
              { value: 'connected', label: 'Connected' },
              { value: 'no_answer', label: 'No Answer' },
              { value: 'busy', label: 'Busy' },
              { value: 'voicemail', label: 'Voicemail' },
              { value: 'callback_scheduled', label: 'Callback Scheduled' },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Call notes..."
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Follow-up Date" type="date" value={form.followUpDate} onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))} />
          <Input label="Follow-up Notes" value={form.followUpNotes} onChange={(e) => setForm((f) => ({ ...f, followUpNotes: e.target.value }))} placeholder="What to follow up on" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} loading={createMutation.isPending} icon={<Phone size={16} />}>
            Log Call
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function HistoryTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [outcomeFilter, setOutcomeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['call-tracker', { page, outcome: outcomeFilter }],
    queryFn: () => callTrackerApi.list({ page, limit: 20, outcome: outcomeFilter || undefined }),
  });

  const completeMutation = useMutation({
    mutationFn: (id: number) => callTrackerApi.completeFollowUp(id),
    onSuccess: () => {
      toast.success('Follow-up completed');
      queryClient.invalidateQueries({ queryKey: ['call-tracker'] });
      queryClient.invalidateQueries({ queryKey: ['call-tracker-follow-ups'] });
    },
  });

  if (isLoading) return <PageLoader />;

  const items = (data as any)?.data || [];
  const meta = (data as any)?.meta;

  const OUTCOME_BADGE: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
    connected: 'success',
    no_answer: 'warning',
    busy: 'danger',
    voicemail: 'info',
    callback_scheduled: 'info',
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <Select
          value={outcomeFilter}
          onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: 'All Outcomes' },
            { value: 'connected', label: 'Connected' },
            { value: 'no_answer', label: 'No Answer' },
            { value: 'busy', label: 'Busy' },
            { value: 'voicemail', label: 'Voicemail' },
            { value: 'callback_scheduled', label: 'Callback Scheduled' },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Phone size={48} />} title="No call logs" description="Log your first call from the Log Call tab." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outcome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {item.callDate}
                      {item.callTime && <span className="text-xs text-gray-400 ml-1">{item.callTime}</span>}
                    </td>
                    <td className="px-4 py-3">
                      {item.callType === 'outgoing' ? <PhoneOutgoing size={14} className="text-blue-500" /> : <PhoneIncoming size={14} className="text-green-500" />}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.duration ? `${item.duration} min` : '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={OUTCOME_BADGE[item.outcome] || 'default'}>
                        {item.outcome?.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{item.notes || '-'}</td>
                    <td className="px-4 py-3">
                      {item.followUpDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{item.followUpDate}</span>
                          {!item.followUpCompleted && (
                            <button
                              onClick={() => completeMutation.mutate(item.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Mark complete"
                            >
                              <CheckCircle size={14} />
                            </button>
                          )}
                          {item.followUpCompleted && <CheckCircle size={14} className="text-green-500" />}
                        </div>
                      ) : '-'}
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

function AnalyticsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['call-analytics'],
    queryFn: () => callTrackerApi.getAnalytics(),
  });

  if (isLoading) return <PageLoader />;

  const a = data as any;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calls by Day */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Calls by Day</h3>
          {(a?.callsByDay || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(a?.callsByDay || []).map((d: any) => (
                <div key={d.date} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-600">{d.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-100 rounded-full h-2">
                      <div className="bg-green-500 rounded-full h-2" style={{ width: `${Math.min(100, (d.count / 20) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{d.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Outcomes Breakdown */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold mb-4">Outcome Breakdown</h3>
          <div className="space-y-3">
            {(a?.byOutcome || []).map((o: any) => (
              <div key={o.outcome} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-700">{o.outcome?.replace(/_/g, ' ')}</span>
                <span className="text-sm font-bold text-gray-900">{o.count}</span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Avg Duration</span>
                <span className="text-sm font-bold text-gray-900">{a?.avgDuration ?? 0} min</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
