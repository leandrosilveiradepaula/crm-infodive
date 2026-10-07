import { mkdirSync, writeFileSync } from 'node:fs';

const outputDir = 'artifacts';
mkdirSync(outputDir, { recursive: true });

const evidence = {
  schema_version: 1,
  status: 'passed',
  repository: process.env.GITHUB_REPOSITORY || 'unknown',
  commit_sha: process.env.GITHUB_SHA || 'unknown',
  run_id: process.env.GITHUB_RUN_ID || 'unknown',
  run_attempt: process.env.GITHUB_RUN_ATTEMPT || 'unknown',
  workflow: process.env.GITHUB_WORKFLOW || 'unknown',
  ref: process.env.GITHUB_REF || 'unknown',
  generated_at: new Date().toISOString(),
  gates: [
    'npm_ci',
    'typescript',
    'new_lint_errors',
    'dependency_audit_regression',
    'migration_policy',
    'product_surface_audit',
    'paid_ai_endpoint_audit',
    'tests',
    'build',
    'browser_smoke_desktop_mobile_keyboard_route_guard',
    'diff_check'
  ]
};

writeFileSync(
  joinPath(outputDir, 'quality-evidence.json'),
  JSON.stringify(evidence, null, 2) + '\n',
  'utf8'
);

function joinPath(...parts) {
  return parts.join('/');
}

console.log(`QUALITY_EVIDENCE_WRITTEN commit=${evidence.commit_sha} run=${evidence.run_id}`);
