
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const dealId = '4e7c20d8-974d-4b9c-a661-940bba91532e';

async function checkAudit() {
    console.log('--- Checking Audit Logs ---');
    const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or(`record_id.eq.${dealId},payload->>deal_id.eq.${dealId}`)
        .order('created_at', { ascending: false })
        .limit(100);

    if (!error && logs) {
        console.log(`Found ${logs.length} logs.`);
        // Search for 'DELETE' actions on deal_products
        const deletions = logs.filter(l => l.table_name === 'deal_products' && l.action === 'DELETE');
        console.log(`Found ${deletions.length} deletions in audit logs.`);
        if (deletions.length > 0) {
            console.log(JSON.stringify(deletions.slice(0, 5), null, 2));
        }
        
        // Search for 'INSERT' to see what was there
        const insertions = logs.filter(l => l.table_name === 'deal_products' && l.action === 'INSERT');
        console.log(`Found ${insertions.length} insertions in audit logs.`);
        if (insertions.length > 0) {
            console.log(JSON.stringify(insertions.map(i => i.payload?.name || i.payload?.product_name), null, 2));
        }
    } else if (error) {
        console.error('Audit Log Error:', error);
    }
}

checkAudit();
