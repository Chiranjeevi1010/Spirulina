import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Phone, PhoneOutgoing, PhoneIncoming, Plus, CheckCircle, BarChart3 } from 'lucide-react';
import { Button, Input, Card, CardBody, Select, Modal, Pagination, PageLoader, EmptyState, Badge } from '../components/ui';
import { callTrackerApi } from '../services/modules.api';

type Tab = 'log' | 'history' | 'analytics';

export default function CallTrackerPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('log');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('callTracker.title')}</h1>
          <p className="text-sm text-gray-500">{t('callTracker.subtitle')}</p>
        </div>
      </div>

      <CallStats />

      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {([
            { key: 'log', label: t('callTracker.logCallTab'), icon: <Plus size={16} /> },
            { key: 'history', label: t('callTracker.historyTab'), icon: <Phone size={16} /> },
            { key: 'analytics', label: t('callTracker.analyticsTab'), icon: <BarChart3 size={16} /> },
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

      {tab === 'log' && <LogCallTab />}
      {tab === 'history' && <HistoryTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}

function CallStats() {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['call-stats'],
    queryFn: () => callTrackerApi.getStats(),
  });

  const { data: target } = useQuery({
    queryKey: ['call-daily-target'],
    queryFn: () => callTrackerApi.getDailyTarget(),
  });

  const s = data as any;
  const tgt = target as any;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-green-700">{tgt?.made ?? 0} / {tgt?.target ?? 20}</p>
        <p className="text-xs text-gray-500">{t('callTracker.callsToday')}</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-blue-700">{tgt?.remaining ?? 20}</p>
        <p className="text-xs text-gray-500">{t('callTracker.remainingCalls')}</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <p className="text-2xl font-bold text-purple-700">{s?.callsThisWeek ?? 0}</p>
        <p className="text-xs text-gray-500">{t('callTracker.thisWeek')}</p>
      </CardBody></Card>
      <Card><CardBody className="text-center py-3">
        <div className="flex flex-wrap justify-center gap-1">
          {(s?.byOutcome || []).slice(0, 3).map((o: any) => (
            <span key={o.outcome} className="text-xs bg-gray-100 px-2 py-0.5 rounded capitalize">{o.outcome}: {o.count}</span>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">{t('callTracker.outcomes')}</p>
      </CardBody></Card>
    </div>
  );
}

function LogCallTab() {
  const { t } = useTranslation();
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
      toast.success(t('callTracker.callLogged'));
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
    onError: () => toast.error(t('callTracker.callLogFailed')),
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
          <Input label={`${t('callTracker.callDate')} *`} type="date" value={form.callDate} onChange={(e) => setForm((f) => ({ ...f, callDate: e.target.value }))} />
          <Input label={t('callTracker.callTime')} type="time" value={form.callTime} onChange={(e) => setForm((f) => ({ ...f, callTime: e.target.value }))} />
          <Input label={t('callTracker.durationMin')} type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label={`${t('callTracker.callType')} *`}
            value={form.callType}
            onChange={(e) => setForm((f) => ({ ...f, callType: e.target.value }))}
            options={[
              { value: 'outgoing', label: t('callTracker.outgoing') },
              { value: 'incoming', label: t('callTracker.incoming') },
            ]}
          />
          <Select
            label={`${t('callTracker.outcome')} *`}
            value={form.outcome}
            onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
            options={[
              { value: 'connected', label: t('callTracker.connected') },
              { value: 'no_answer', label: t('callTracker.noAnswer') },
              { value: 'busy', label: t('callTracker.busy') },
              { value: 'voicemail', label: t('callTracker.voicemail') },
              { value: 'callback_scheduled', label: t('callTracker.callbackScheduled') },
            ]}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.notes')}</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder={t('callTracker.callNotes')}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('callTracker.followUpDate')} type="date" value={form.followUpDate} onChange={(e) => setForm((f) => ({ ...f, followUpDate: e.target.value }))} />
          <Input label={t('callTracker.followUpNotesLabel')} value={form.followUpNotes} onChange={(e) => setForm((f) => ({ ...f, followUpNotes: e.target.value }))} placeholder={t('callTracker.followUpNotesLabel')} />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} loading={createMutation.isPending} icon={<Phone size={16} />}>
            {t('callTracker.logCallBtn')}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function HistoryTab() {
  const { t } = useTranslation();
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
      toast.success(t('callTracker.followUpCompleted'));
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
            { value: '', label: t('callTracker.allOutcomes') },
            { value: 'connected', label: t('callTracker.connected') },
            { value: 'no_answer', label: t('callTracker.noAnswer') },
            { value: 'busy', label: t('callTracker.busy') },
            { value: 'voicemail', label: t('callTracker.voicemail') },
            { value: 'callback_scheduled', label: t('callTracker.callbackScheduled') },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <EmptyState icon={<Phone size={48} />} title={t('callTracker.noCallLogs')} description={t('callTracker.logFirstCall')} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.date')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('callTracker.duration')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('callTracker.outcome')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.notes')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('callTracker.followUp')}</th>
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
                              title={t('callTracker.markComplete')}
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
  const { t } = useTranslation();
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
          <h3 className="text-lg font-semibold mb-4">{t('callTracker.callsByDay')}</h3>
          {(a?.callsByDay || []).length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('callTracker.noDataYet')}</p>
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
          <h3 className="text-lg font-semibold mb-4">{t('callTracker.outcomeBreakdown')}</h3>
          <div className="space-y-3">
            {(a?.byOutcome || []).map((o: any) => (
              <div key={o.outcome} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-700">{o.outcome?.replace(/_/g, ' ')}</span>
                <span className="text-sm font-bold text-gray-900">{o.count}</span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{t('callTracker.avgDuration')}</span>
                <span className="text-sm font-bold text-gray-900">{a?.avgDuration ?? 0} min</span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
