// Test-only schema compatibility and actual RPCs from checked-in migrations.
// Never run this on a linked or hosted database. No production migration is applied.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321' ||
    process.env.CRM_E2E_BASE_URL !== 'http://127.0.0.1:3000' ||
    process.env.CRM_E2E_BACKEND_ISOLATED !== 'true' ||
    process.env.CRM_E2E_TEST_TARGET !== 'isolated' || !process.env.RUNNER_TEMP) {
    throw new Error('PRODUCT_QA_UNSAFE_TARGET');
}
const source = [
    ['20240129000030_client_portal_and_proposals.sql', 'get_deal_room_by_token', 'text'],
    ['20260206000001_add_proposal_signatures.sql', 'get_proposal_by_public_token', 'text'],
    ['20260303000001_proposals_multitenancy_and_numbers.sql', 'get_next_proposal_number', 'uuid'],
];
const definitions = source.map(([file, fn, type]) => {
    const text = readFileSync('supabase/migrations/' + file, 'utf8');
    const start = text.indexOf('CREATE OR REPLACE FUNCTION public.' + fn + '(');
    const end = text.indexOf('$$;', start + 1);
    if (start < 0 || end < start) throw new Error('PRODUCT_QA_RPC_SOURCE_MISSING');
    // Exact function body, with the authoritative service-only ACL.
    return text.slice(start, end + 3) + '\nREVOKE ALL ON FUNCTION public.' + fn +
        '(' + type + ') FROM PUBLIC, anon, authenticated;\nGRANT EXECUTE ON FUNCTION public.' +
        fn + '(' + type + ') TO service_role;';
});
const ddl = [
    'ALTER TABLE public.account_contacts ADD COLUMN IF NOT EXISTS linkedin text;',
    'ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS contact_name text, ADD COLUMN IF NOT EXISTS cnpj text, ADD COLUMN IF NOT EXISTS street text, ADD COLUMN IF NOT EXISTS neighborhood text, ADD COLUMN IF NOT EXISTS city text, ADD COLUMN IF NOT EXISTS state text, ADD COLUMN IF NOT EXISTS zip text;',
    'ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS source text;',
    'ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS account_id uuid, ADD COLUMN IF NOT EXISTS lead_id uuid, ADD COLUMN IF NOT EXISTS company_name text, ADD COLUMN IF NOT EXISTS template_id text, ADD COLUMN IF NOT EXISTS content_json jsonb, ADD COLUMN IF NOT EXISTS products_json jsonb, ADD COLUMN IF NOT EXISTS terms text, ADD COLUMN IF NOT EXISTS public_token text UNIQUE DEFAULT md5(gen_random_uuid()::text), ADD COLUMN IF NOT EXISTS allow_signature boolean DEFAULT false, ADD COLUMN IF NOT EXISTS signature_required boolean DEFAULT false, ADD COLUMN IF NOT EXISTS sent_at timestamptz, ADD COLUMN IF NOT EXISTS viewed_at timestamptz, ADD COLUMN IF NOT EXISTS signed_at timestamptz;',
    ...definitions,
    "NOTIFY pgrst, 'reload schema';",
];
try {
    // The existing SQL fixture's schema is intentionally minimal. Add only
    // fields the real tested server actions use; never add permissive policies.
    execFileSync('psql', ['-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres'],
        { input: 'BEGIN;\n' + ddl.join('\n') + '\nCOMMIT;\n', env: { ...process.env, PGPASSWORD: 'postgres' }, stdio: ['pipe','pipe','pipe'] });
} catch {
    throw new Error('PRODUCT_QA_FIXTURE_SCHEMA_OR_RPC_FAILED');
}
console.log('CRM_PRODUCT_QA_RPC_SOURCE=3; local_only=true; acl=service_role');
