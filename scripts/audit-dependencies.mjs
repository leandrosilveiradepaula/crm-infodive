import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const baseline = JSON.parse(readFileSync('config/dependency-audit-baseline.json', 'utf8'));
const result = spawnSync('npm', ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 30 * 1024 * 1024,
});

if (!result.stdout) {
  process.stderr.write(result.stderr || 'npm audit returned no JSON output\n');
  process.exit(1);
}

let audit;
try {
  audit = JSON.parse(result.stdout);
} catch {
  process.stderr.write('npm audit output was not valid JSON\n');
  process.stderr.write(result.stdout.slice(0, 4000));
  process.exit(1);
}

const current = audit.metadata?.vulnerabilities;
if (!current) {
  console.error('DEPENDENCY_AUDIT_FAILED: vulnerability metadata missing');
  process.exit(1);
}

const severities = ['critical', 'high', 'moderate', 'low'];
const regressions = [];
for (const severity of severities) {
  const observed = Number(current[severity] || 0);
  const allowed = Number(baseline.vulnerabilities?.[severity] ?? -1);
  console.log(`DEPENDENCY_AUDIT ${severity}: ${observed} (baseline ${allowed})`);
  if (allowed < 0 || observed > allowed) regressions.push({ severity, observed, allowed });
}

if (regressions.length) {
  for (const item of regressions) {
    console.error(`DEPENDENCY_AUDIT_REGRESSION ${item.severity}: ${item.observed} > ${item.allowed}`);
  }
  process.exit(1);
}

console.log('DEPENDENCY_AUDIT_OK: no severity count increased above the committed legacy baseline');
