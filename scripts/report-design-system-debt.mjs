#!/usr/bin/env node
/**
 * Read-only inventory of local visual decisions. Run from repository root:
 *   node scripts/report-design-system-debt.mjs --summary
 *   node scripts/report-design-system-debt.mjs --markdown
 * No files are modified; the full matrix can be attached to QA evidence.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { countViolations } from './check-design-token-policy.mjs';

const roots = ['src/app', 'src/components'];
function walk(folder) {
  const results = [];
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isDirectory()) results.push(...walk(path));
    else if (item.isFile() && /\.(tsx?|jsx?|css)$/.test(item.name)) results.push(path);
  }
  return results;
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
const rows = roots.flatMap(walk).map(path => {
  const file = relative('.', path).split(sep).join('/');
  const counts = countViolations(readFileSync(path, 'utf8'));
  return { file, family: family(file), ...counts, total: Object.values(counts).reduce((sum, n) => sum + n, 0) };
}).filter(row => row.total > 0).sort((a, b) => b.total - a.total || a.file.localeCompare(b.file));
const categories = Object.keys(countViolations(''));
const total = rows.reduce((sum, row) => sum + row.total, 0);
if (process.argv.includes('--markdown')) {
  console.log('| Familia | Arquivo | ' + categories.join(' | ') + ' | Total |');
  console.log('|---|---|' + categories.map(() => '---:|').join('') + '---:|');
  for (const row of rows) console.log('| ' + row.family + ' | ' + row.file + ' | ' + categories.map(name => row[name]).join(' | ') + ' | ' + row.total + ' |');
} else {
  const byFamily = {};
  for (const row of rows) {
    const acc = byFamily[row.family] ??= { files: 0, decisions: 0 };
    acc.files += 1;
    acc.decisions += row.total;
  }
  console.log(JSON.stringify({ affectedFiles: rows.length, localDecisions: total, byFamily, highestDebtFiles: rows.slice(0, 12).map(row => ({ path: row.file, count: row.total })) }, null, 2));
}
