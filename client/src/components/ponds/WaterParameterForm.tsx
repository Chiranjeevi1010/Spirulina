import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, Input, Select, Button, Card, CardBody, CardTitle } from '../ui';
import { createWaterParameterSchema } from '@spirulina/shared';
import type { CreateWaterParameterRequest } from '@spirulina/shared';
import { useCreateWaterParameter } from '../../hooks/usePonds';

interface WaterParameterFormProps {
  isOpen: boolean;
  onClose: () => void;
  pondId: number;
  pondName?: string;
}

const readingTimeOptions = [
  { value: 'morning', label: 'Morning (6-9 AM)' },
  { value: 'noon', label: 'Noon (12-2 PM)' },
  { value: 'evening', label: 'Evening (5-7 PM)' },
];

const foamLevelOptions = [
  { value: 'none', label: 'None' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

export function WaterParameterForm({ isOpen, onClose, pondId, pondName }: WaterParameterFormProps) {
  const createParam = useCreateWaterParameter();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWaterParameterRequest>({
    resolver: zodResolver(createWaterParameterSchema),
    defaultValues: {
      readingDate: new Date().toISOString().slice(0, 10),
      readingTime: 'morning',
    },
  });

  const onSubmit = (data: CreateWaterParameterRequest) => {
    createParam.mutate(
      { pondId, data },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add Water Parameters${pondName ? ` — ${pondName}` : ''}`} size="xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardBody>
            <CardTitle>Reading Info</CardTitle>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <Input label="Reading Date" type="date" {...register('readingDate')} error={errors.readingDate?.message} />
              <Select label="Reading Time" options={readingTimeOptions} {...register('readingTime')} error={errors.readingTime?.message} />
            </div>
          </CardBody>
        </Card>

        {/* Water Quality */}
        <Card>
          <CardBody>
            <CardTitle>Water Quality</CardTitle>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <Input label="pH" type="number" step="0.01" {...register('ph', { valueAsNumber: true })} />
              <Input label="Salinity (ppt)" type="number" step="0.1" {...register('salinityPpt', { valueAsNumber: true })} />
              <Input label="Temperature (°C)" type="number" step="0.1" {...register('temperatureC', { valueAsNumber: true })} />
            </div>
          </CardBody>
        </Card>

        {/* Carbonates & Alkalinity */}
        <Card>
          <CardBody>
            <CardTitle>Carbonates & Alkalinity</CardTitle>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <Input label="Carbonates CO3 (mg/L)" type="number" step="1" {...register('carbonateCo3', { valueAsNumber: true })} />
              <Input label="Bicarbonates HCO3 (mg/L)" type="number" step="1" {...register('bicarbonateHco3', { valueAsNumber: true })} />
              <Input label="Total Alkalinity (mg/L)" type="number" step="1" {...register('alkalinity', { valueAsNumber: true })} />
            </div>
          </CardBody>
        </Card>

        {/* Hardness & Minerals */}
        <Card>
          <CardBody>
            <CardTitle>Hardness & Minerals</CardTitle>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <Input label="Total Hardness (mg/L)" type="number" step="1" {...register('totalHardness', { valueAsNumber: true })} />
              <Input label="Calcium Ca (mg/L)" type="number" step="1" {...register('calciumCa', { valueAsNumber: true })} />
              <Input label="Magnesium Mg (mg/L)" type="number" step="1" {...register('magnesiumMg', { valueAsNumber: true })} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <Input label="Sodium Na (mg/L)" type="number" step="1" {...register('sodiumNa', { valueAsNumber: true })} />
              <Input label="Potassium K (mg/L)" type="number" step="1" {...register('potassiumK', { valueAsNumber: true })} />
            </div>
          </CardBody>
        </Card>

        {/* Nitrogen & Dissolved Oxygen */}
        <Card>
          <CardBody>
            <CardTitle>Nitrogen & Dissolved Oxygen</CardTitle>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
              <Input label="Total Ammonia (mg/L)" type="number" step="0.01" {...register('totalAmmonia', { valueAsNumber: true })} />
              <Input label="Un-ionized NH3 (mg/L)" type="number" step="0.01" {...register('ammoniaNh3', { valueAsNumber: true })} />
              <Input label="Nitrite NO2 (mg/L)" type="number" step="0.01" {...register('nitriteNo2', { valueAsNumber: true })} />
              <Input label="DO (mg/L)" type="number" step="0.1" {...register('dissolvedOxygen', { valueAsNumber: true })} />
            </div>
          </CardBody>
        </Card>

        {/* Other */}
        <Card>
          <CardBody>
            <CardTitle>Other Parameters</CardTitle>
            <div className="grid grid-cols-3 gap-4 mt-3">
              <Select label="Foam Level" options={foamLevelOptions} {...register('foamLevel')} />
              <Input label="Paddle Wheel RPM" type="number" step="1" {...register('paddleWheelRpm', { valueAsNumber: true })} />
              <Input label="Harvest %" type="number" step="0.1" {...register('harvestPercentage', { valueAsNumber: true })} />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea {...register('notes')} rows={2} className="input-field" placeholder="Observations..." />
            </div>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={createParam.isPending}>Save Reading</Button>
        </div>
      </form>
    </Modal>
  );
}
