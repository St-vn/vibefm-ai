export const colors = {
  background: '#000000',
  surface: '#0D0D0D',
  surfaceElevated: '#1A1A1A',
  border: 'rgba(255,255,255,0.08)',
  purple: '#7C3AED',
  cyan: '#06B6D4',
  green: '#22C55E',
  danger: '#EF4444',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#4B5563',
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32,
} as const;

export const fonts = {
  display: 'System',
  mono: 'System',
  body: 'System',
} as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;
