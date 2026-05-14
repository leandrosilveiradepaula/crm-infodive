
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listTables() {
    // We can't list tables directly via Supabase client, but we can try to query common ones
    const tables = [
        'proposals', 'proposal_items', 'deal_products', 'deal_quotes', 'activities', 
        'audit_logs', 'historical_products'
    ];
    
    for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (!error) {
            console.log(`Table exists: ${table}`);
        } else {
            // Check if it's a "does not exist" error
            if (error.code === '42P01') {
                // console.log(`Table does not exist: ${table}`);
            } else {
                console.log(`Table ${table} error: ${error.message} (${error.code})`);
            }
        }
    }
}

listTables();
