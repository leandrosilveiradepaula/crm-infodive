import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

const details = Object.entries(audit.vulnerabilities || {})
  .filter(([, value]) => value?.severity === 'critical' || value?.severity === 'high')
  .map(([name, value]) => ({
    name,
    severity: value.severity,
    isDirect: Boolean(value.isDirect),
    range: value.range || null,
    fixAvailable: value.fixAvailable ?? false,
    via: Array.isArray(value.via)
      ? value.via.map(item => typeof item === 'string'
        ? { dependency: item }
        : {
            source: item.source ?? null,
            name: item.name ?? null,
            dependency: item.dependency ?? null,
            title: item.title ?? null,
            url: item.url ?? null,
            range: item.range ?? null,
          })
      : [],
  }))
  .sort((a, b) => a.severity.localeCompare(b.severity) || a.name.localeCompare(b.name));

mkdirSync('artifacts', { recursive: true });
writeFileSync(
  'artifacts/dependency-audit.json',
  JSON.stringify({
    schema_version: 1,
    generated_at: new Date().toISOString(),
    counts: Object.fromEntries(severities.map(severity => [severity, Number(current[severity] || 0)])),
    baseline: baseline.vulnerabilities || {},
    critical_high: details,
  }, null, 2) + '\n',
  'utf8',
);

for (const item of details) {
  console.log(`DEPENDENCY_AUDIT_PACKAGE ${item.severity} ${item.name} direct=${item.isDirect} fix=${JSON.stringify(item.fixAvailable)}`);
}
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

console.log(`DEPENDENCY_AUDIT_OK: no severity count increased above the committed legacy baseline; critical/high packages=${details.length}`);
