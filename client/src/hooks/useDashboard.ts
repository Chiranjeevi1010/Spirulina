import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboard.api';

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: dashboardApi.getKPIs,
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activities'],
    queryFn: dashboardApi.getRecentActivities,
    refetchInterval: 60000,
  });
}
