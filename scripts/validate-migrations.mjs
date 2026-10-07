import { readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const baseRef = process.env.GITHUB_BASE_REF || process.argv[2] || 'main';
const migrationDir = 'supabase/migrations';

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function changedMigrationFiles() {
  runGit(['fetch', 'origin', baseRef]);
  const mergeBase = runGit(['merge-base', `origin/${baseRef}`, 'HEAD']);
  const output = runGit([
    'diff', '--name-only', '--diff-filter=ACMR', mergeBase, 'HEAD', '--', migrationDir
  ]);
  if (!output) return [];
  return output.split('\n').filter(Boolean).filter(path => path.endsWith('.sql'));
}

function normalizeSql(sql) {
  return sql
    .replace(/--.*$/gm, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const violations = [];
const changed = changedMigrationFiles();

for (const path of changed) {
  const file = basename(path);
  if (!/^\d{14}_[a-z0-9_]+\.sql$/i.test(file)) {
    violations.push(`${path}: nome deve seguir YYYYMMDDHHMMSS_descricao.sql`);
    continue;
  }

  const raw = readFileSync(path, 'utf8');
  const sql = normalizeSql(raw);

  if (!sql) {
    violations.push(`${path}: migration vazia`);
    continue;
  }

  if (/\bdo\s+\$(?!\$)/i.test(raw) || /\n\s*\$(?!\$)\s*;/m.test(raw)) {
    violations.push(`${path}: dollar quoting malformado em bloco DO; use $ ... $`);
  }

  if (/auth\.jwt\s*\(\s*\)[\s\S]{0,160}user_metadata/.test(sql)) {
    violations.push(`${path}: authorization via auth.jwt().user_metadata é proibida`);
  }

  if (/alter\s+table[\s\S]{0,120}disable\s+row\s+level\s+security/.test(sql)) {
    violations.push(`${path}: DISABLE ROW LEVEL SECURITY é proibido em migration nova`);
  }

  if (/create\s+policy[\s\S]{0,500}\busing\s*\(\s*true\s*\)/.test(sql)) {
    violations.push(`${path}: política RLS permissiva USING (true) é proibida`);
  }

  if (/create\s+policy[\s\S]{0,500}\bwith\s+check\s*\(\s*true\s*\)/.test(sql)) {
    violations.push(`${path}: política RLS permissiva WITH CHECK (true) é proibida`);
  }

  if (/security\s+definer/.test(sql) && !/set\s+search_path\s*=/.test(sql)) {
    violations.push(`${path}: SECURITY DEFINER exige SET search_path explícito`);
  }
}

const ids = new Map();
for (const file of readdirSync(migrationDir).filter(name => name.endsWith('.sql'))) {
  const match = file.match(/^(\d{14})_/);
  if (!match) continue;
  const id = match[1];
  const files = ids.get(id) || [];
  files.push(file);
  ids.set(id, files);
}

const allowedLegacyDuplicateIds = new Set(['20240129000060']);
for (const [id, files] of ids) {
  if (files.length > 1 && !allowedLegacyDuplicateIds.has(id)) {
    violations.push(`${migrationDir}: timestamp duplicado ${id}: ${files.join(', ')}`);
  }
}

if (violations.length) {
  for (const violation of violations) {
    console.error(`MIGRATION_POLICY_ERROR ${violation}`);
  }
  console.error(`MIGRATION_POLICY_FAILED=${violations.length}`);
  process.exit(1);
}

console.log(`MIGRATION_POLICY_OK: ${changed.length} migration(s) alterada(s) validada(s)`);
