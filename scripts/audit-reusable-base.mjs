#!/usr/bin/env node
// Read-only portability inventory. Never prints matches, URLs, secrets, data,
// connection strings or file contents. This does NOT copy or deploy the CRM.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const files = execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const sha = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const excluded = files.filter(p => /(?:^|\/)(?:\.env(?:$|\.)|\.vercel\/|\.envrc$)|^supabase\/\.temp\/|(?:^|\/)schema_dump[^/]*\.sql$|\.(?:pem|key)$/i.test(p));
const bound = [];
const branded = [];
const envNames = new Set();
for(const p of files) {
    if(!/^(?:src\/|scripts\/|test\/|\.github\/|docs\/|supabase\/migrations\/|README\.md)/.test(p) ||
        !/\.(?:tsx?|mjs|js|sql|md|ya?ml|json)$/.test(p) || excluded.includes(p) ||
        p==='scripts/audit-reusable-base.mjs') continue;
    const source = readFileSync(p,'utf8');
    if(/[a-z0-9]{20}\.supabase\.co/i.test(source)) bound.push(p);
    if(/^src\//.test(p)&&/infodive\.com\.br|logo-infodive|Infodive/.test(source)) branded.push(p);
    for(const m of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) envNames.add(m[1]);
}
console.log(JSON.stringify({candidateSha:sha,trackedFiles:files.length,
    reusableExport:'NOT_AUTHORIZED_AND_NOT_CREATED',
    readiness:excluded.length||bound.length||branded.length?'BLOCKED_FOR_DIRECT_CLONE':'REQUIRES_CLEAN_BOOTSTRAP_PROOF',
    excludedFromFutureExport:excluded, environmentBoundSourceFiles:bound, identityBoundApplicationFiles:branded,
    environmentVariableNames:[...envNames].sort(),
    gates:['owner-approved release baseline','clean source-only export and identity parameterization','fresh isolated environment using full migration history','secret and tenant separation review','same-SHA build and browser certification'],
    limitation:'Filename and source-pattern inventory only, not a secret scan or migration replay. No raw matched values emitted.'
},null,2));
