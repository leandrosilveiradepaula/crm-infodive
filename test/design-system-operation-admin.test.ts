import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const modules = [
  "src/components/settings/SecurityTab.tsx",
  "src/components/settings/UsersTab.tsx",
  "src/components/settings/UsersSettings.tsx",
  "src/components/settings/PipelineSettings.tsx",
  "src/components/settings/AuditLogTab.tsx",
  "src/components/settings/ProfileSettings.tsx",
  "src/app/(dashboard)/settings/client-page.tsx",
  "src/components/settings/InviteUserModal.tsx",
  "src/components/settings/ArchiveUserModal.tsx",
  "src/components/settings/ConnectEmailButton.tsx",
  "src/components/settings/EditUserModal.tsx",
  "src/components/settings/OrganizationThemeSettings.tsx",
  "src/components/settings/RoleSelect.tsx",
  "src/app/(dashboard)/activities/client-page.tsx",
  "src/app/(dashboard)/activities/components/ActivityModal.tsx",
  "src/app/(dashboard)/activities/components/CalendarView.tsx",
  "src/components/automations/AutomationBuilder.tsx",
  "src/components/automations/HistorySheet.tsx",
  "src/components/automations/NewAutomationModal.tsx",
  "src/components/contracts/ContractBuilder.tsx",
  "src/components/contracts/ContractViewer.tsx",
  "src/components/contracts/SignatureModal.tsx",
  "src/components/contracts/SignaturePad.tsx",
  "src/app/(dashboard)/service-desk/service-desk-client.tsx",
  "src/app/(dashboard)/contracts/client-page.tsx",
  "src/app/(dashboard)/service-desk/knowledge/knowledge-client.tsx"
] as const;
const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const legacyLocal = {
  palette: /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?\b/g,
  fontSize: /\btext-\[(?:\d+(?:\.\d+)?)(?:px|rem)\]/g,
  typeScale: /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g,
  radius: /\brounded-(?:sm|md|lg|xl|[2-4]xl)\b/g,
  shadow: /\bshadow-(?:sm|md|lg|xl|[2-3]xl)\b/g,
};
describe('Existing operation and administration modules use centralized semantic roles', () => {
  it.each(modules)('%s has no anonymous palette, text scale, radius or shadow', path => {
    const code = read(path);
    for (const [rule, expression] of Object.entries(legacyLocal)) {
      expect(code.match(expression), `${path}: ${rule}`).toBeNull();
    }
  });
  it('retains original settings persistence, activity state and isolated service desk', () => {
    expect(read('src/app/(dashboard)/settings/client-page.tsx')).toContain('saveOrgSettings(form)');
    expect(read('src/app/(dashboard)/activities/client-page.tsx')).toContain('useState');
    expect(read('src/app/(dashboard)/service-desk/service-desk-client.tsx')).toContain('useState');
    expect(read('src/components/settings/UsersSettings.tsx')).toContain('getUsers');
  });
});
