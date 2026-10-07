import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('browser smoke contract', () => {
  it('covers desktop, mobile, keyboard and protected-route behavior', () => {
    const source = readFileSync('scripts/browser-smoke.mjs', 'utf8');
    expect(source).toContain('login_desktop_renders');
    expect(source).toContain('login_mobile_renders');
    expect(source).toContain('keyboard_tab_reaches_login_controls');
    expect(source).toContain('protected_dashboard_redirects_unauthenticated');
    expect(source).toContain('invite_registration_state_renders');
    expect(source).toContain('browser-smoke.json');
  });

  it('is wired into CI after the production build and retained as evidence', () => {
    const workflow = readFileSync('.github/workflows/crm-validation.yml', 'utf8');
    const build = workflow.indexOf('- name: Build');
    const smoke = workflow.indexOf('- name: Browser smoke');
    expect(build).toBeGreaterThan(-1);
    expect(smoke).toBeGreaterThan(build);
    expect(workflow).toContain('playwright@1.63.0');
    expect(workflow).toContain('crm-browser-smoke-');
    expect(workflow).toContain('retention-days: 30');
  });

  it('records the browser smoke in release quality evidence', () => {
    const source = readFileSync('scripts/write-quality-evidence.mjs', 'utf8');
    expect(source).toContain('browser_smoke_desktop_mobile_keyboard_route_guard');
  });
});
