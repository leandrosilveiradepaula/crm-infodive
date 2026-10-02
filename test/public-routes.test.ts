import { describe, expect, it } from 'vitest';
import { isPublicRoute } from '../src/lib/public-routes';

describe('public route policy', () => {
  it('allows login and intentional public routes', () => {
    expect(isPublicRoute('/login')).toBe(true);
    expect(isPublicRoute('/auth/callback')).toBe(true);
    expect(isPublicRoute('/api/auth/logout')).toBe(true);
    expect(isPublicRoute('/proposals/public/abcdef1234567890')).toBe(true);
    expect(isPublicRoute('/portal/abcdef1234567890abcdef1234567890')).toBe(true);
    expect(isPublicRoute('/api/proposals/public/abcdef1234567890')).toBe(true);
  });

  it('keeps authenticated routes protected', () => {
    expect(isPublicRoute('/dashboard')).toBe(false);
    expect(isPublicRoute('/api/auth/me')).toBe(false);
    expect(isPublicRoute('/api/customers/import')).toBe(false);
  });
});
