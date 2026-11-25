/**
 * Shared semantic treatment for quantitative overview tiles.
 * Pages select a meaning, never a palette, gradient or per-module color class.
 * All visual VALUES are resolved by src/design-system/tokens.css.
 */
export const statToneClasses = {
  primary: 'bg-primary/10 text-primary',
  info: 'bg-info-subtle text-foreground',
  success: 'bg-success-subtle text-success-readable',
  warning: 'bg-warning-subtle text-warning-readable',
  destructive: 'bg-destructive-subtle text-destructive-readable',
  neutral: 'bg-muted text-foreground',
} as const;

export type StatTone = keyof typeof statToneClasses;
