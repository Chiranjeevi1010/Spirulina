import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pondsApi } from '../services/ponds.api';
import type { CreatePondRequest, CreateWaterParameterRequest } from '@spirulina/shared';
import toast from 'react-hot-toast';

export function usePonds(filters?: { page?: number; limit?: number; status?: string; healthStatus?: string; search?: string }) {
  return useQuery({
    queryKey: ['ponds', filters],
    queryFn: () => pondsApi.list(filters),
  });
}

export function usePond(id: number | undefined) {
  return useQuery({
    queryKey: ['pond', id],
    queryFn: () => pondsApi.getById(id!),
    enabled: !!id,
  });
}

export function usePondOverview() {
  return useQuery({
    queryKey: ['ponds', 'overview'],
    queryFn: pondsApi.overview,
  });
}

export function useCreatePond() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePondRequest) => pondsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      toast.success('Pond created successfully');
    },
    onError: () => toast.error('Failed to create pond'),
  });
}

export function useUpdatePond() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreatePondRequest> }) => pondsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      queryClient.invalidateQueries({ queryKey: ['pond', variables.id] });
      toast.success('Pond updated successfully');
    },
    onError: () => toast.error('Failed to update pond'),
  });
}

export function useDeletePond() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => pondsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      toast.success('Pond deactivated');
    },
    onError: () => toast.error('Failed to delete pond'),
  });
}

export function useWaterParameters(pondId: number | undefined, filters?: { page?: number; limit?: number; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['water-parameters', pondId, filters],
    queryFn: () => pondsApi.getWaterParameters(pondId!, filters),
    enabled: !!pondId,
  });
}

export function useLatestReading(pondId: number | undefined) {
  return useQuery({
    queryKey: ['water-parameters', pondId, 'latest'],
    queryFn: () => pondsApi.getLatestReading(pondId!),
    enabled: !!pondId,
  });
}

export function useCreateWaterParameter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pondId, data }: { pondId: number; data: CreateWaterParameterRequest }) => pondsApi.createWaterParameter(pondId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['water-parameters', variables.pondId] });
      queryClient.invalidateQueries({ queryKey: ['pond', variables.pondId] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      toast.success('Water parameters recorded');
    },
    onError: () => toast.error('Failed to record water parameters'),
  });
}

export function useUpdateWaterParameter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pondId, id, data }: { pondId: number; id: number; data: Partial<CreateWaterParameterRequest> }) =>
      pondsApi.updateWaterParameter(pondId, id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['water-parameters', variables.pondId] });
      queryClient.invalidateQueries({ queryKey: ['pond', variables.pondId] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      toast.success('Water parameters updated');
    },
    onError: () => toast.error('Failed to update water parameters'),
  });
}

export function useDeleteWaterParameter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pondId, id }: { pondId: number; id: number }) =>
      pondsApi.deleteWaterParameter(pondId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['water-parameters', variables.pondId] });
      queryClient.invalidateQueries({ queryKey: ['pond', variables.pondId] });
      queryClient.invalidateQueries({ queryKey: ['ponds'] });
      toast.success('Water parameter reading deleted');
    },
    onError: () => toast.error('Failed to delete water parameters'),
  });
}

export function useParameterTrends(pondId: number | undefined, parameter: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['water-parameters', pondId, 'trends', parameter, startDate, endDate],
    queryFn: () => pondsApi.getTrends(pondId!, parameter, startDate, endDate),
    enabled: !!pondId && !!parameter,
  });
}
