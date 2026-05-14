
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const dealId = '4e7c20d8-974d-4b9c-a661-940bba91532e';

async function findDeleted() {
    console.log('--- Searching for deletions in audit_logs ---');
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .ilike('details', `%${dealId}%`)
        .order('created_at', { ascending: false });

    if (!error && logs) {
        console.log(`Found ${logs.length} logs for this deal.`);
        for (const log of logs) {
            console.log(`[${log.created_at}] ${log.action}: ${log.details}`);
        }
    } else {
        console.error('Error:', error);
    }
}

findDeleted();
