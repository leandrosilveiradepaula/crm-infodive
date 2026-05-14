
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRecentHistory() {
    console.log('--- Checking Recent Historical Products ---');
    const { data: history, error: histError } = await supabase
        .from('historical_products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (!histError && history) {
        console.log(`Found ${history.length} recent historical products.`);
        console.log(JSON.stringify(history, null, 2));
    } else {
        console.log('Error or no data:', histError);
    }
}

checkRecentHistory();
