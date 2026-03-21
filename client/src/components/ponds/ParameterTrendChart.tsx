import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import type { WaterParameter } from '@spirulina/shared';

interface ParameterTrendChartProps {
  data: WaterParameter[];
  parameter: string;
}

const parameterConfig: Record<string, { label: string; key: keyof WaterParameter; color: string; idealMin?: number; idealMax?: number }> = {
  ph: { label: 'pH', key: 'ph', color: '#059669', idealMin: 9.5, idealMax: 10.5 },
  temperatureC: { label: 'Temperature (°C)', key: 'temperatureC', color: '#dc2626', idealMin: 30, idealMax: 37 },
  dissolvedOxygen: { label: 'DO (mg/L)', key: 'dissolvedOxygen', color: '#2563eb', idealMin: 5, idealMax: 10 },
  ammoniaNh3: { label: 'Ammonia NH3 (mg/L)', key: 'ammoniaNh3', color: '#d97706', idealMax: 0.5 },
  totalHardness: { label: 'Total Hardness (mg/L)', key: 'totalHardness', color: '#7c3aed', idealMin: 300, idealMax: 800 },
  salinityPpt: { label: 'Salinity (ppt)', key: 'salinityPpt', color: '#0891b2', idealMin: 10, idealMax: 20 },
  magnesiumMg: { label: 'Magnesium (mg/L)', key: 'magnesiumMg', color: '#be185d' },
  calciumCa: { label: 'Calcium (mg/L)', key: 'calciumCa', color: '#65a30d' },
};

export function ParameterTrendChart({ data, parameter }: ParameterTrendChartProps) {
  const config = parameterConfig[parameter];
  if (!config) return null;

  const chartData = data
    .filter(d => d[config.key] !== null && d[config.key] !== undefined)
    .map(d => ({
      date: d.readingDate,
      value: Number(d[config.key]),
      risk: d.overallRisk,
    }))
    .reverse();

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        No data available for {config.label}
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(label) => `Date: ${label}`}
            formatter={(value: number) => [value.toFixed(2), config.label]}
          />
          {config.idealMin !== undefined && (
            <ReferenceLine y={config.idealMin} stroke="#22c55e" strokeDasharray="5 5" label="Min" />
          )}
          {config.idealMax !== undefined && (
            <ReferenceLine y={config.idealMax} stroke="#22c55e" strokeDasharray="5 5" label="Max" />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke={config.color}
            strokeWidth={2}
            dot={{ fill: config.color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
