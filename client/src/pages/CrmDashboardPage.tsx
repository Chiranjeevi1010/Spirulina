import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Target, Mail, Phone, Users, Clock, Search } from 'lucide-react';
import { Card, CardBody, PageLoader } from '../components/ui';
import { crmDashboardApi, callTrackerApi } from '../services/modules.api';
import { Link } from 'react-router-dom';

export default function CrmDashboardPage() {
  const { t } = useTranslation();
  const { data: summary, isLoading } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: () => crmDashboardApi.getSummary(),
    refetchInterval: 60000,
  });

  const { data: followUps } = useQuery({
    queryKey: ['call-tracker-follow-ups'],
    queryFn: () => callTrackerApi.getFollowUps(),
  });

  if (isLoading) return <PageLoader />;

  const s = summary as any;
  const fups = (followUps as any[]) || [];

  const stats = [
    {
      label: t('crm.extractedLeadsPending'),
      value: s?.extractedLeadsPending ?? 0,
      sub: `${s?.extractedToday ?? 0} ${t('crm.extractedToday').toLowerCase()}`,
      icon: <Search size={24} />,
      color: 'bg-purple-50 text-purple-700',
      link: '/crm/extracted-leads',
    },
    {
      label: t('crm.emailsSentToday'),
      value: `${s?.emailsSentToday ?? 0} / ${s?.emailDailyLimit ?? 20}`,
      sub: `${Math.max(0, (s?.emailDailyLimit ?? 20) - (s?.emailsSentToday ?? 0))} ${t('emailModule.remainingToday').toLowerCase()}`,
      icon: <Mail size={24} />,
      color: 'bg-blue-50 text-blue-700',
      link: '/crm/email',
    },
    {
      label: t('crm.callsMadeToday'),
      value: `${s?.callsMadeToday ?? 0} / ${s?.callDailyTarget ?? 20}`,
      sub: `${Math.max(0, (s?.callDailyTarget ?? 20) - (s?.callsMadeToday ?? 0))} ${t('callTracker.remainingCalls').toLowerCase()}`,
      icon: <Phone size={24} />,
      color: 'bg-green-50 text-green-700',
      link: '/crm/call-tracker',
    },
    {
      label: t('crm.pendingFollowUps'),
      value: s?.pendingFollowUps ?? 0,
      sub: t('crm.dueToday'),
      icon: <Clock size={24} />,
      color: 'bg-orange-50 text-orange-700',
      link: '/crm/call-tracker',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('crm.dashboardTitle')}</h1>
          <p className="text-sm text-gray-500">{t('crm.dashboardSubtitle')}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.sub}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Pipeline */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-4">
              <Users size={20} className="text-gray-600" />
              <h2 className="text-lg font-semibold">{t('crm.leadPipeline')}</h2>
            </div>
            <div className="space-y-2">
              {(s?.leadPipeline || []).map((p: any) => (
                <div key={p.status} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm font-medium text-gray-700 capitalize">{p.status}</span>
                  <span className="text-sm font-bold text-gray-900">{p.count}</span>
                </div>
              ))}
              {(!s?.leadPipeline || s.leadPipeline.length === 0) && (
                <p className="text-sm text-gray-400 py-4 text-center">{t('crm.noLeadsYet')}</p>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Pending Follow-ups */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 mb-4">
              <Clock size={20} className="text-orange-600" />
              <h2 className="text-lg font-semibold">{t('crm.pendingFollowUps')}</h2>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {fups.slice(0, 10).map((f: any) => (
                <div key={f.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{f.notes || 'Follow-up call'}</p>
                    <p className="text-xs text-gray-400">Due: {f.followUpDate}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full">
                    {f.outcome}
                  </span>
                </div>
              ))}
              {fups.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">{t('crm.noPendingFollowUps')}</p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">{t('crm.quickActions')}</h2>
          <div className="flex flex-wrap gap-3">
            <Link to="/crm/extracted-leads" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-2">
              <Search size={16} /> {t('crm.reviewExtractedLeads')}
            </Link>
            <Link to="/crm/email" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
              <Mail size={16} /> {t('crm.sendEmail')}
            </Link>
            <Link to="/crm/call-tracker" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-2">
              <Phone size={16} /> {t('crm.logCall')}
            </Link>
            <Link to="/leads" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium flex items-center gap-2">
              <Target size={16} /> {t('crm.viewAllLeads')}
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
