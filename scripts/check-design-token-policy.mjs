#!/usr/bin/env node
/**
 * Incremental guard: each changed UI file must not increase its count of local
 * visual decisions. The legacy baseline is the merge-base, not a frozen list.
 * Centralized values in src/design-system/tokens.css are not UI hardcodes.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const policies = {
  'literal-palette': /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-(?:\d{2,3})(?:\/\d{1,3})?\b/g,
  'gradient-local': /\b(?:bg-gradient-to-|bg-linear-to-|bg-radial\b|bg-conic\b)|\b(?:linear|radial|conic)-gradient\s*\(/g,
  'literal-hex': /#[a-fA-F0-9]{6}(?:[a-fA-F0-9]{2})?\b/g,
  'font-size-local': /\btext-\[(?:\d+(?:\.\d+)?)(?:px|rem)\]/g,
  'font-scale-local': /\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/g,
  'radius-local': /\brounded-(?:sm|md|lg|xl|[2-4]xl)\b/g,
  'shadow-local': /\bshadow-(?:sm|md|lg|xl|[2-3]xl)\b/g,
};

/**
 * Once migrated, these cross-family modules are strict: no palette literals,
 * private type scale, component radius/shadow, or hardcoded gradients may return.
 * Extending this list is a one-way migration; do not suppress an active violation.
 */
export const fullyMigratedModules = Object.freeze([
  'src/components/pipeline/product-row/ProductFinancialDetails.tsx',
  'src/app/(dashboard)/sales/tabs/DashboardTab.tsx',
  'src/components/goals/tabs/PlanningTab.tsx',
  'src/components/pipeline/WonDealWizard.tsx',
  'src/app/(dashboard)/sales/tabs/OrdersTab.tsx',
  'src/app/(dashboard)/sales/tabs/InstallmentsTab.tsx',
  'src/app/(dashboard)/automations/client-page.tsx',
  'src/components/supply-chain/PurchaseOrderManager.tsx',
  'src/components/pipeline/ProductDetailsTable.tsx',
  'src/components/proposals/ViewProposalModal.tsx',
  'src/components/shared/DocumentsTab.tsx',
  'src/components/proposals/ProposalGeneratorWizard.tsx',
  'src/components/goals/FinancialSummaryCard.tsx',
  'src/components/goals/tabs/GoalsTab.tsx',
  'src/components/goals/tabs/CommissionsTab.tsx',
  'src/components/goals/DistributionModal.tsx',
]);

export function countViolations(source) {
  return Object.fromEntries(Object.entries(policies).map(([name, pattern]) => {
    const rx = new RegExp(pattern.source, pattern.flags);
    return [name, [...source.matchAll(rx)].length];
  }));
}

export function compareCounts(before, after) {
  const oldCounts = countViolations(before), newCounts = countViolations(after);
  return Object.keys(policies)
    .map(rule => ({ rule, previous: oldCounts[rule], current: newCounts[rule] }))
    .filter(row => row.current > row.previous);
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function scoped(path) {
  return /^src\/(?:app\/(?:\(dashboard\)\/|globals\.css$|layout\.tsx$)|components\/)/.test(path)
    && /\.(?:tsx?|jsx?|css)$/.test(path);
}

function main() {
  let base = process.argv[2];
  if (!base) {
    try { base = git('merge-base', 'origin/main', 'HEAD'); }
    catch {
      console.error('Missing base commit. Fetch origin/main or supply BASE_SHA.');
      process.exitCode = 2;
      return;
    }
  }
  const files = git('diff', '--name-only', '--diff-filter=ACMR', base, 'HEAD', '--', 'src/app', 'src/components')
    .split('\n').filter(Boolean).filter(scoped);
  const failures = [];
  for (const path of files) {
    let before = '';
    try { before = git('show', base + ':' + path); }
    catch { /* New file: zero baseline. */ }
    const after = readFileSync(path, 'utf8');
    for (const regression of compareCounts(before, after)) failures.push({ file: path, ...regression });
  }
  for (const file of fullyMigratedModules) {
    const counts = countViolations(readFileSync(file, 'utf8'));
    for (const [rule, current] of Object.entries(counts)) {
      if (current > 0) failures.push({ file, rule, previous: 0, current });
    }
  }
  console.log('DESIGN_SYSTEM_STRICT: ' + fullyMigratedModules.length + ' locked migrated modules');
  console.log('DESIGN_SYSTEM_POLICY: ' + files.length + ' changed UI file(s), ' + failures.length + ' hardcode regression(s)');
  if (failures.length) {
    for (const issue of failures) {
      console.error(issue.file + ': ' + issue.rule + ': ' + issue.previous + ' -> ' + issue.current);
    }
    console.error('Use src/design-system/tokens.css and shared primitives. No new local visual values.');
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
