#!/usr/bin/env node
/**
 * Install QA-only browser dependencies without mutating the built CRM runtime.
 *
 * npm install --no-save in the repository root previously replaced hundreds
 * of dependencies after npm run build, potentially invalidating React Server
 * Actions. Use an isolated temporary prefix and link only the two named QA
 * packages. Never install, mutate, or resolve runtime app dependencies here.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();
const scratch = resolve(process.env.RUNNER_TEMP || tmpdir(), 'crm-b4-isolated-browser-tools');
const modules = join(root, 'node_modules');
const packages = Object.freeze({ 'playwright-core': '1.64.1', 'axe-core': '4.14.0' });

function sha(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const tracked = [
  join(root, 'package-lock.json'),
  join(modules, 'next/package.json'),
  join(modules, 'react/package.json'),
  join(modules, 'react-dom/package.json'),
];
for (const file of tracked) {
  if (!existsSync(file)) throw new Error('QA browser toolchain requires npm ci and Next.js build prerequisites.');
}
const before = tracked.map(sha);
mkdirSync(scratch, { recursive: true });
execFileSync('npm', [
  'install', '--prefix', scratch, '--no-save', '--no-package-lock',
  '--ignore-scripts', '--no-audit', '--no-fund',
  ...Object.entries(packages).map(([name, version]) => name + '@' + version),
], { stdio: 'inherit' });

for (const [name, version] of Object.entries(packages)) {
  const external = join(scratch, 'node_modules', name);
  const installed = JSON.parse(readFileSync(join(external, 'package.json'), 'utf8'));
  if (installed.version !== version) {
    throw new Error('CRM_B4_BROWSER_TOOLS=BLOCKED: QA package pin mismatch');
  }
}
const after = tracked.map(sha);
if (before.some((hash, index) => hash !== after[index])) {
  throw new Error('CRM_B4_BROWSER_TOOLS=BLOCKED: CRM runtime packages changed after build');
}
// The CRM lockfile already contains axe-core 4.11.x. We must NOT replace that
// dependency after the build. Point ONLY the synthetic QA scripts at the
// independently pinned browser toolchain; keep all app module paths untouched.
const playwrightPath = join(scratch, 'node_modules', 'playwright-core', 'index.mjs');
const axePath = join(scratch, 'node_modules', 'axe-core', 'axe.min.js');
if (!existsSync(playwrightPath) || !existsSync(axePath)) {
  throw new Error('CRM_B4_BROWSER_TOOLS=BLOCKED: pinned QA entrypoint missing');
}
if (!process.env.GITHUB_ENV) {
  throw new Error('CRM_B4_BROWSER_TOOLS=BLOCKED: GitHub environment handoff missing');
}
appendFileSync(process.env.GITHUB_ENV,
  'PLAYWRIGHT_CORE_PATH=' + playwrightPath + '\n' +
  'CRM_QA_AXE_MIN_PATH=' + axePath + '\n');
process.stdout.write('CRM_B4_BROWSER_TOOLS=ISOLATED; runtime_integrity=PASS; packages=2\n');
