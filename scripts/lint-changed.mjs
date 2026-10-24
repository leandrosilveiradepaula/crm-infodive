import { execFileSync, spawnSync } from 'node:child_process';

const baseRef = process.env.GITHUB_BASE_REF || process.argv[2] || 'main';

function runGit(args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }).trim();
}

function parseAddedRanges(diff) {
  const files = new Map();
  let current = null;
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      current = line.slice(6);
      if (!files.has(current)) files.set(current, []);
      continue;
    }
    if (!current || !line.startsWith('@@')) continue;
    const match = line.match(/\+(\d+)(?:,(\d+))?/);
    if (!match) continue;
    const start = Number(match[1]);
    const count = Number(match[2] || '1');
    if (count > 0) files.get(current).push([start, start + count - 1]);
  }
  return files;
}

function isSource(path) {
  return /^src\//.test(path) && /\.(?:[cm]?[jt]sx?)$/.test(path);
}

runGit(['fetch', 'origin', baseRef]);
const mergeBase = runGit(['merge-base', `origin/${baseRef}`, 'HEAD']);
const diff = runGit(['diff', '--unified=0', '--diff-filter=ACMR', mergeBase, 'HEAD', '--', 'src']);
const ranges = parseAddedRanges(diff);
const files = [...ranges.keys()].filter(isSource);

if (!files.length) {
  console.log('LINT_CHANGED_OK: no changed source files');
  process.exit(0);
}

const result = spawnSync('npx', ['eslint', '--format', 'json', ...files], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 20 * 1024 * 1024,
});

if (!result.stdout) {
  process.stderr.write(result.stderr || 'eslint produced no JSON output\n');
  process.exit(result.status || 1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  process.stderr.write(result.stdout);
  process.stderr.write(result.stderr || '');
  process.exit(result.status || 1);
}

const violations = [];
for (const fileReport of report) {
  const relative = fileReport.filePath.replace(process.cwd() + '/', '');
  const fileRanges = ranges.get(relative) || [];
  for (const message of fileReport.messages || []) {
    if (message.severity !== 2 || !message.line) continue;
    const isChangedLine = fileRanges.some(([start, end]) => message.line >= start && message.line <= end);
    if (isChangedLine) violations.push({ file: relative, line: message.line, column: message.column, ruleId: message.ruleId, message: message.message });
  }
}

if (violations.length) {
  for (const violation of violations) {
    console.error(`LINT_CHANGED_ERROR ${violation.file}:${violation.line}:${violation.column} ${violation.ruleId || ''} ${violation.message}`);
  }
  console.error(`LINT_CHANGED_FAILED=${violations.length}`);
  process.exit(1);
}

console.log(`LINT_CHANGED_OK: ${files.length} changed source file(s), no new lint errors on changed lines`);
