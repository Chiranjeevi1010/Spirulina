import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Select, Button } from '../ui';
import { createPondSchema } from '@spirulina/shared';
import type { Pond, CreatePondRequest } from '@spirulina/shared';
import { useCreatePond, useUpdatePond } from '../../hooks/usePonds';

interface PondFormProps {
  isOpen: boolean;
  onClose: () => void;
  pond?: Pond | null;
}

const pondTypeOptions = [
  { value: 'open_raceway', label: 'Open Raceway' },
  { value: 'closed', label: 'Closed' },
  { value: 'tubular', label: 'Tubular' },
  { value: 'mixed', label: 'Mixed' },
];

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'maintenance', label: 'Maintenance' },
];

export function PondForm({ isOpen, onClose, pond }: PondFormProps) {
  const createPond = useCreatePond();
  const updatePond = useUpdatePond();
  const isEditing = !!pond;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreatePondRequest>({
    resolver: zodResolver(createPondSchema),
    defaultValues: {
      pondType: 'open_raceway',
      status: 'active',
    },
  });

  useEffect(() => {
    if (pond) {
      reset({
        name: pond.name,
        code: pond.code,
        lengthM: Number(pond.lengthM),
        widthM: Number(pond.widthM),
        depthM: Number(pond.depthM),
        pondType: pond.pondType,
        location: pond.location || '',
        dateCommissioned: pond.dateCommissioned || '',
        notes: pond.notes || '',
      });
    } else {
      reset({
        name: '',
        code: '',
        lengthM: 0,
        widthM: 0,
        depthM: 0,
        pondType: 'open_raceway',
        status: 'active',
        location: '',
        dateCommissioned: '',
        notes: '',
      });
    }
  }, [pond, reset]);

  const lengthM = watch('lengthM');
  const widthM = watch('widthM');
  const depthM = watch('depthM');

  const calculatedVolume = useMemo(() => {
    const l = Number(lengthM) || 0;
    const w = Number(widthM) || 0;
    const d = Number(depthM) || 0;
    return (l * w * d * 1000).toFixed(0);
  }, [lengthM, widthM, depthM]);

  const onSubmit = (data: CreatePondRequest) => {
    if (isEditing && pond) {
      updatePond.mutate(
        { id: pond.id, data },
        { onSuccess: () => { onClose(); } },
      );
    } else {
      createPond.mutate(data, { onSuccess: () => { onClose(); } });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Pond' : 'Add New Pond'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Pond Name" {...register('name')} error={errors.name?.message} placeholder="e.g. Pond A1" />
          <Input label="Pond Code" {...register('code')} error={errors.code?.message} placeholder="e.g. PA1" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Length (m)" type="number" step="0.1" {...register('lengthM', { valueAsNumber: true })} error={errors.lengthM?.message} />
          <Input label="Width (m)" type="number" step="0.1" {...register('widthM', { valueAsNumber: true })} error={errors.widthM?.message} />
          <Input label="Depth (m)" type="number" step="0.01" {...register('depthM', { valueAsNumber: true })} error={errors.depthM?.message} />
        </div>

        {Number(calculatedVolume) > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 text-center">
            <span className="text-sm text-primary-700">Calculated Volume: </span>
            <span className="font-bold text-primary-800">{Number(calculatedVolume).toLocaleString()} liters</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Pond Type" options={pondTypeOptions} {...register('pondType')} />
          <Select label="Status" options={statusOptions} {...register('status')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Location" {...register('location')} placeholder="e.g. Block A, North Side" />
          <Input label="Date Commissioned" type="date" {...register('dateCommissioned')} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            {...register('notes')}
            rows={3}
            className="input-field"
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createPond.isPending || updatePond.isPending}>
            {isEditing ? 'Update Pond' : 'Create Pond'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
