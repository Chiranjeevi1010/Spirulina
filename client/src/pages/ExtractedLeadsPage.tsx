import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, CheckCircle, XCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { Button, Card, CardBody, DataTable, Pagination, PageLoader, EmptyState, Badge, Select } from '../components/ui';
import { extractedLeadsApi } from '../services/modules.api';

const STATUS_BADGE: Record<string, 'default' | 'info' | 'success' | 'danger' | 'warning'> = {
  new: 'info',
  reviewed: 'warning',
  approved: 'success',
  rejected: 'danger',
  contacted: 'default',
};

export default function ExtractedLeadsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selected, setSelected] = useState<number[]>([]);

  const CATEGORIES = [
    { value: '', label: t('extractedLeads.allCategories') },
    { value: 'nutraceuticals', label: t('extractedLeads.nutraceuticals') },
    { value: 'poultry_farm', label: t('extractedLeads.poultryFarms') },
    { value: 'livestock', label: t('extractedLeads.livestock') },
    { value: 'fisheries', label: t('extractedLeads.fisheries') },
    { value: 'shrimp', label: t('extractedLeads.shrimpFarms') },
    { value: 'aquaculture', label: t('extractedLeads.aquaculture') },
    { value: 'animal_feed', label: t('extractedLeads.animalFeed') },
    { value: 'health_supplements', label: t('extractedLeads.healthSupplements') },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['extracted-leads', { page, status: statusFilter, category: categoryFilter }],
    queryFn: () => extractedLeadsApi.list({ page, limit: 20, status: statusFilter || undefined, category: categoryFilter || undefined }),
  });

  const { data: stats } = useQuery({
    queryKey: ['extracted-leads-stats'],
    queryFn: () => extractedLeadsApi.getStats(),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => extractedLeadsApi.review(id, { status }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'approved' ? t('extractedLeads.leadApproved') : t('extractedLeads.leadRejected'));
      queryClient.invalidateQueries({ queryKey: ['extracted-leads'] });
      queryClient.invalidateQueries({ queryKey: ['extracted-leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
    onError: () => toast.error(t('common.failed')),
  });

  const bulkReviewMutation = useMutation({
    mutationFn: (data: { ids: number[]; status: string }) => extractedLeadsApi.bulkReview(data),
    onSuccess: (result: any) => {
      toast.success(t('extractedLeads.bulkReviewCompleted'));
      queryClient.invalidateQueries({ queryKey: ['extracted-leads'] });
      queryClient.invalidateQueries({ queryKey: ['extracted-leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setSelected([]);
    },
    onError: () => toast.error(t('common.failed')),
  });

  const triggerMutation = useMutation({
    mutationFn: () => extractedLeadsApi.trigger(),
    onSuccess: (result: any) => {
      toast.success(t('extractedLeads.extractionCompleted'));
      queryClient.invalidateQueries({ queryKey: ['extracted-leads'] });
      queryClient.invalidateQueries({ queryKey: ['extracted-leads-stats'] });
    },
    onError: () => toast.error(t('extractedLeads.extractionFailed')),
  });

  const items = (data as any)?.data || [];
  const meta = (data as any)?.meta;
  const statsData = stats as any;

  const toggleSelect = (id: number) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selected.length === items.length) setSelected([]);
    else setSelected(items.map((i: any) => i.id));
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('extractedLeads.title')}</h1>
          <p className="text-sm text-gray-500">{t('extractedLeads.subtitle')}</p>
        </div>
        <Button
          onClick={() => triggerMutation.mutate()}
          loading={triggerMutation.isPending}
          icon={<RefreshCw size={16} />}
        >
          {t('extractedLeads.extractNow')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(statsData?.byStatus || []).map((s: any) => (
          <Card key={s.status}>
            <CardBody className="text-center py-3">
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-xs text-gray-500 capitalize">{s.status}</p>
            </CardBody>
          </Card>
        ))}
        <Card>
          <CardBody className="text-center py-3">
            <p className="text-2xl font-bold text-purple-700">{statsData?.extractedToday ?? 0}</p>
            <p className="text-xs text-gray-500">{t('crm.extractedToday')}</p>
          </CardBody>
        </Card>
      </div>

      {/* Filters + Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          options={[
            { value: '', label: t('extractedLeads.allStatuses') },
            { value: 'new', label: t('extractedLeads.newStatus') },
            { value: 'approved', label: t('common.approved') },
            { value: 'rejected', label: t('common.rejected') },
          ]}
        />
        <Select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          options={CATEGORIES}
        />
        {selected.length > 0 && (
          <>
            <Button size="sm" variant="primary" onClick={() => bulkReviewMutation.mutate({ ids: selected, status: 'approved' })}>
              {t('extractedLeads.approve')} ({selected.length})
            </Button>
            <Button size="sm" variant="danger" onClick={() => bulkReviewMutation.mutate({ ids: selected, status: 'rejected' })}>
              {t('extractedLeads.reject')} ({selected.length})
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState
          icon={<Search size={48} />}
          title={t('extractedLeads.noExtractedLeads')}
          description={t('extractedLeads.noExtractedLeadsDesc')}
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={selected.length === items.length && items.length > 0} onChange={toggleSelectAll} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('extractedLeads.business')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('leads.contact')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.category')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.date')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{item.businessName}</div>
                      {item.website && (
                        <a href={item.website} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                          <ExternalLink size={10} /> Website
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700">{item.phone || '-'}</div>
                      <div className="text-xs text-gray-400">{item.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize">{item.category?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_BADGE[item.status] || 'default'}>{item.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{item.extractionDate}</td>
                    <td className="px-4 py-3 text-right">
                      {(item.status === 'new' || item.status === 'reviewed') && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => reviewMutation.mutate({ id: item.id, status: 'approved' })}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title={t('extractedLeads.approve')}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => reviewMutation.mutate({ id: item.id, status: 'rejected' })}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title={t('extractedLeads.reject')}
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
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
    </div>
  );
}
