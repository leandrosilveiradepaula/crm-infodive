const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const sb = createClient(sbUrl, sbKey);

async function check() {
    const account_id = '3c1230f7-f51f-43cb-854f-80c65968913b';
    console.log('--- DB Check Bypass RLS ---');

    const { data: acc, error: errA } = await sb.from('accounts').select('id, organization_id, name').eq('id', account_id).single();
    console.log('Account:', acc || errA?.message);

    const { data: contacts, error: errC } = await sb.from('account_contacts').select('id, account_id, name').eq('account_id', account_id);
    console.log('Contacts for this account count:', contacts?.length);
    if (contacts?.length) {
        console.log('First Contact:', contacts[0]);
    }
}
check();
