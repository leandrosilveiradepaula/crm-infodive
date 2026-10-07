import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src';
const EXTENSIONS = new Set(['.ts', '.tsx']);

const rules = [
  {
    id: 'micro-typography',
    pattern: /text-\[(?:9|10|11)px\]/g,
    message: 'Tipografia abaixo de 12px não é permitida em UI de produto.'
  },
  {
    id: 'legacy-brand-watson',
    pattern: /Watson AI/g,
    message: 'Branding legado Watson AI deve ser removido ou substituído pela identidade do CRM.'
  },
  {
    id: 'legacy-brand-nexus',
    pattern: /Nexus CRM/g,
    message: 'Branding legado Nexus CRM deve ser removido.'
  },
  {
    id: 'legacy-brand-crm-next',
    pattern: /CRM Next/g,
    message: 'Branding legado CRM Next deve ser removido.'
  },
  {
    id: 'legacy-brand-antigravity',
    pattern: /Antigravity AI/g,
    message: 'Branding legado Antigravity AI deve ser removido.'
  },
  {
    id: 'empty-onclick',
    pattern: /onClick=\{\(\)\s*=>\s*\{\s*\}\}/g,
    message: 'Controle interativo sem ação real não pode ficar exposto.'
  },
  {
    id: 'known-automation-noop',
    pattern: /Skipping conditions for now/g,
    message: 'AutomationBuilder ainda contém condição explicitamente ignorada.'
  }
];

function extension(path) {
  const match = path.match(/\.[^.]+$/);
  return match?.[0] || '';
}

function walk(dir) {
  const result = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) result.push(...walk(path));
    else if (EXTENSIONS.has(extension(path)) && !path.includes('.test.')) result.push(path);
  }
  return result;
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

const violations = [];
for (const path of walk(ROOT)) {
  const source = readFileSync(path, 'utf8');
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      violations.push({
        rule: rule.id,
        file: relative('.', path),
        line: lineNumber(source, match.index || 0),
        excerpt: match[0],
        message: rule.message
      });
    }
  }
}

if (violations.length) {
  for (const item of violations) {
    console.error(
      `PRODUCT_SURFACE_ERROR [${item.rule}] ${item.file}:${item.line} ${item.message} Encontrado: ${JSON.stringify(item.excerpt)}`
    );
  }
  console.error(`PRODUCT_SURFACE_AUDIT_FAILED=${violations.length}`);
  process.exit(1);
}

console.log('PRODUCT_SURFACE_AUDIT_OK: nenhuma microtipografia, branding legado ou no-op conhecido encontrado');
