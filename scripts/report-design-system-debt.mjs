#!/usr/bin/env node
/**
 * Read-only inventory of local visual decisions. Run from repository root:
 *   node scripts/report-design-system-debt.mjs --summary
 *   node scripts/report-design-system-debt.mjs --markdown
 * No files are modified; the full matrix can be attached to QA evidence.
 */
import { sep } from 'node:path';
import { countViolations, inspectVisualSourceDebt } from './check-design-token-policy.mjs';

function surfaceKind(file) {
  // @react-pdf/renderer uses JS style objects, not browser CSS variables.
  // Retain all counted debt but report those documents separately instead of
  // implying the main web theme alone can propagate to exported PDF pages.
  return file.startsWith('src/components/proposals/pdf/')
    ? 'PDF export renderer'
    : 'Web CRM and preview';
}
function family(path) {
  const normalized = path.split(sep).join('/');
  if (/\/pipeline\/|\/DealCard|\/DealModal|\/DealForm/.test(normalized)) return 'Pipeline e drawers';
  if (/\/dashboard\/|\/layout\/|\/design-preview\//.test(normalized)) return 'Shell e Dashboard';
  if (/\/(?:leads|contacts|customers|proposals|sales|products|price-lists)\//.test(normalized)) return 'Comercial';
  if (/\/(?:inbox|activities|contracts|automations|service-desk)\//.test(normalized)) return 'Operacao';
  if (/\/(?:reports|goals|integrations|settings)\//.test(normalized)) return 'Analytics e admin';
  if (/\/components\/ui\//.test(normalized)) return 'Componentes compartilhados';
  return 'Outros';
}
const rows = inspectVisualSourceDebt().map(({ file, counts, total }) => ({
  file, family: family(file), surface: surfaceKind(file), ...counts, total,
})).sort((a, b) => b.total - a.total || a.file.localeCompare(b.file));
const categories = Object.keys(countViolations(''));
const total = rows.reduce((sum, row) => sum + row.total, 0);
if (process.argv.includes('--markdown')) {
  console.log('| Familia | Arquivo | ' + categories.join(' | ') + ' | Total |');
  console.log('|---|---|' + categories.map(() => '---:|').join('') + '---:|');
  for (const row of rows) console.log('| ' + row.family + ' | ' + row.file + ' | ' + categories.map(name => row[name]).join(' | ') + ' | ' + row.total + ' |');
} else {
  const byFamily = {};
  const bySurface = {};
  for (const row of rows) {
    const surface = bySurface[row.surface] ??= { files: 0, decisions: 0 };
    surface.files += 1;
    surface.decisions += row.total;
    const acc = byFamily[row.family] ??= { files: 0, decisions: 0 };
    acc.files += 1;
    acc.decisions += row.total;
  }
  console.log(JSON.stringify({ affectedFiles: rows.length, localDecisions: total, byFamily, bySurface, highestDebtFiles: rows.slice(0, 12).map(row => ({ path: row.file, count: row.total })), remainingFiles: rows.map(row => ({ path: row.file, count: row.total })) }, null, 2));
}
