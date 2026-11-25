import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * One semantic text contract: typography metrics are configured in
 * src/design-system/tokens.css, not chosen independently in feature pages.
 */
const variants = {
  pageTitle: 'ds-type-page-title text-foreground',
  sectionTitle: 'ds-type-section-title text-foreground',
  body: 'ds-type-body text-foreground',
  supporting: 'ds-type-body text-muted-foreground',
  label: 'ds-type-label text-foreground',
  table: 'ds-type-table text-foreground',
  metadata: 'ds-type-metadata text-muted-foreground',
  control: 'ds-type-control',
} as const;

type TypographyVariant = keyof typeof variants;
type TypographyTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div' | 'label';

type TypographyProps = React.HTMLAttributes<HTMLElement> & {
  as?: TypographyTag;
  variant?: TypographyVariant;
};

export function Typography({
  as: Tag = 'p',
  variant = 'body',
  className,
  ...props
}: TypographyProps) {
  return <Tag data-slot="typography" data-variant={variant} className={cn(variants[variant], className)} {...props} />;
}

export { variants as typographyVariants };
