import { Droplets, Factory, IndianRupee, ShoppingCart, AlertTriangle, Users, Package } from 'lucide-react';
import { StatsCard, Card, CardBody, CardTitle, Badge, PageLoader } from '../components/ui';
import { useDashboardKPIs, useRecentActivities } from '../hooks/useDashboard';

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: activities, isLoading: activitiesLoading } = useRecentActivities();

  if (kpisLoading) return <PageLoader />;

  const healthCounts: Record<string, number> = { GREEN: 0, YELLOW: 0, RED: 0 };
  kpis?.pondsByHealth?.forEach((h) => {
    if (h.healthStatus in healthCounts) healthCounts[h.healthStatus] = h.count;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your spirulina operations</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Active Ponds" value={String(kpis?.totalActivePonds ?? 0)} icon={<Droplets className="w-5 h-5" />} />
        <StatsCard title="Harvest This Month" value={`${Number(kpis?.totalHarvestThisMonth ?? 0).toFixed(1)} kg`} icon={<Factory className="w-5 h-5" />} />
        <StatsCard title="Production This Month" value={`${Number(kpis?.totalProductionThisMonth ?? 0).toFixed(1)} kg`} icon={<Package className="w-5 h-5" />} />
        <StatsCard title="Revenue This Month" value={`₹${Number(kpis?.totalRevenueThisMonth ?? 0).toLocaleString()}`} icon={<IndianRupee className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Pond Health Summary */}
        <Card>
          <CardBody>
            <CardTitle>Pond Health</CardTitle>
            <div className="flex items-center justify-around mt-6">
              {[
                { key: 'GREEN', label: 'Healthy', color: 'green' },
                { key: 'YELLOW', label: 'Warning', color: 'yellow' },
                { key: 'RED', label: 'Critical', color: 'red' },
              ].map(({ key, label, color }) => (
                <div key={key} className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-${color}-100 flex items-center justify-center mb-2`}>
                    <span className={`text-2xl font-bold text-${color}-700`}>{healthCounts[key]}</span>
                  </div>
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardBody>
            <CardTitle>Quick Stats</CardTitle>
            <div className="space-y-4 mt-4">
              {[
                { icon: ShoppingCart, label: 'Pending Orders', count: kpis?.pendingOrders ?? 0, variant: 'warning' as const },
                { icon: AlertTriangle, label: 'Low Stock Chemicals', count: kpis?.lowStockChemicals ?? 0, variant: 'danger' as const },
                { icon: Users, label: 'Active Leads', count: kpis?.activeLeads ?? 0, variant: 'info' as const },
                { icon: Package, label: 'Expiring Batches', count: kpis?.expiringBatches ?? 0, variant: 'warning' as const },
              ].map(({ icon: Icon, label, count, variant }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                  <Badge variant={count > 0 ? variant : 'default'}>{count}</Badge>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* P&L Summary */}
        <Card>
          <CardBody>
            <CardTitle>Monthly P&L</CardTitle>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-semibold text-green-600">₹{Number(kpis?.totalRevenueThisMonth ?? 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Expenses</span>
                  <span className="font-semibold text-red-600">₹{Number(kpis?.totalExpensesThisMonth ?? 0).toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${kpis?.totalRevenueThisMonth ? Math.min(100, (Number(kpis.totalExpensesThisMonth) / Number(kpis.totalRevenueThisMonth)) * 100) : 0}%` }} />
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-700">Net Profit</span>
                  <span className="font-bold text-lg">₹{(Number(kpis?.totalRevenueThisMonth ?? 0) - Number(kpis?.totalExpensesThisMonth ?? 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardBody>
          <CardTitle>Recent Activities</CardTitle>
          <div className="mt-4 space-y-3">
            {activitiesLoading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : !activities?.length ? (
              <p className="text-sm text-gray-400">No recent activities yet. Start adding data to see activity here.</p>
            ) : (
              activities.map((activity, idx) => (
                <div key={`${activity.type}-${activity.id}-${idx}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activity.type === 'harvest' ? 'bg-green-100 text-green-600' : activity.type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                    {activity.type === 'harvest' ? <Droplets className="w-4 h-4" /> : activity.type === 'order' ? <ShoppingCart className="w-4 h-4" /> : <IndianRupee className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400">{new Date(activity.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="default">{activity.type}</Badge>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
