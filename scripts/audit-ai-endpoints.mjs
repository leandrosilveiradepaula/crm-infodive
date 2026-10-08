import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_ROOT = 'src/app/api';
const routeFiles = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path);
    else if (name === 'route.ts' || name === 'route.tsx') routeFiles.push(path);
  }
}

walk(API_ROOT);

const paidGenerationPatterns = [
  /\.generateContent\s*\(/,
  /:generateContent(?:\?|\`|'|")/,
  /api\.openai\.com\/v1\/(?:chat\/completions|responses)/,
  /api\.anthropic\.com\/v1\/messages/,
];

const violations = [];
const paidRoutes = [];

for (const path of routeFiles) {
  const source = readFileSync(path, 'utf8');
  if (!paidGenerationPatterns.some(pattern => pattern.test(source))) continue;

  const file = relative('.', path);
  paidRoutes.push(file);

  if (!/require(?:SessionContext|Permission)\s*\(/.test(source)) {
    violations.push({ file, rule: 'auth', message: 'rota paga de IA sem autenticação server-side explícita' });
  }

  if (!/(?:consumeRateLimit|guardPaidAiRequest)\s*\(/.test(source)) {
    violations.push({ file, rule: 'rate-limit', message: 'rota paga de IA sem guard local de abuso/custo' });
  }

  if (!/(?:consumeDurableAiQuota|guardPaidAiRequest)\s*\(/.test(source)) {
    violations.push({ file, rule: 'durable-quota', message: 'rota paga de IA sem quota duravel/distribuida' });
  }
}

if (violations.length) {
  for (const item of violations) {
    console.error(`AI_ENDPOINT_AUDIT_ERROR [${item.rule}] ${item.file}: ${item.message}`);
  }
  console.error(`AI_ENDPOINT_AUDIT_FAILED=${violations.length}`);
  process.exit(1);
}

console.log(`AI_ENDPOINT_AUDIT_OK: ${paidRoutes.length} rota(s) paga(s) coberta(s) por autenticação, guard local e quota durável`);
for (const file of paidRoutes) console.log(`AI_ENDPOINT_AUDIT_ROUTE ${file}`);
