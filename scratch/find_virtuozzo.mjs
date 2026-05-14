
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findVirtuozzo() {
    console.log('--- Searching for "Virtuozzo" in audit_logs ---');
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .ilike('details', '%Virtuozzo%')
        .order('created_at', { ascending: false });

    if (!error && logs) {
        console.log(`Found ${logs.length} logs.`);
        for (const log of logs) {
            console.log(`[${log.created_at}] ${log.action}: ${log.details}`);
        }
    } else {
        console.error('Error:', error);
    }
}

findVirtuozzo();
