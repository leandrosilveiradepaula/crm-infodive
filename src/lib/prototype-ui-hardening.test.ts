import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('prototype UI hardening', () => {
  it('does not expose internal design preview or dead AI actions in the sidebar', () => {
    const sidebar = readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
    expect(sidebar).not.toContain('href="/design-preview"');
    expect(sidebar).not.toContain('onClick={() => { }}');
    expect(sidebar).not.toContain('Watson AI');
  });

  it('hides debug and design-preview routes in production by default', () => {
    for (const path of ['src/app/debug/page.tsx', 'src/app/design-preview/page.tsx']) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain("process.env.NODE_ENV === 'production'");
      expect(source).toContain("process.env.ENABLE_INTERNAL_DEBUG_ROUTES !== 'true'");
      expect(source).toContain('notFound()');
    }
  });
});
