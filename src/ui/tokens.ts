// Tokens de diseño: colores, espaciado, tipografía y tamaños.
// Los componentes usan estos valores en lugar de números sueltos.

export const colors = {
  primary: '#0E7C66',
  primaryPressed: '#0A5E4D',
  primarySoft: '#E3F2EE',
  onPrimary: '#FFFFFF',
  background: '#F6F7F9',
  surface: '#FFFFFF',
  border: '#D7DBE0',
  text: '#14181F',
  textMuted: '#5A6472',
  danger: '#B42318',
  warning: '#8A5200',
  warningSoft: '#FFF4E0',
  success: '#127A3E',
  disabled: '#AEB5BF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const font = {
  small: 13,
  body: 16,
  label: 15,
  title: 20,
  heading: 28,
} as const;

/** Tamaño mínimo de cualquier elemento táctil (RNF-01). */
export const minTouch = 48;
