export const POND_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  maintenance: 'Under Maintenance',
  seeding: 'Seeding',
} as const;

export const HEALTH_STATUS_COLORS = {
  RED: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA', label: 'Critical' },
  YELLOW: { bg: '#FEF9C3', text: '#CA8A04', border: '#FDE68A', label: 'Warning' },
  GREEN: { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0', label: 'Healthy' },
} as const;

export const FOAM_LEVEL_LABELS = {
  none: 'No Foam',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
} as const;

export const READING_TIME_LABELS = {
  morning: 'Morning (6-9 AM)',
  noon: 'Noon (12-2 PM)',
  evening: 'Evening (5-7 PM)',
} as const;

export const POND_TYPES = {
  open_raceway: 'Open Raceway',
  closed_tank: 'Closed Tank',
  tubular: 'Tubular PBR',
} as const;
