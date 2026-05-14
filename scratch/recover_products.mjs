
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const dealId = '4e7c20d8-974d-4b9c-a661-940bba91532e';

async function recoverProducts() {
    console.log('--- Checking Historical Products ---');
    const { data: history, error: histError } = await supabase
        .from('historical_products')
        .select('*')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

    if (!histError && history) {
        console.log(`Found ${history.length} historical products.`);
        console.log(JSON.stringify(history.slice(0, 5), null, 2));
    }

    console.log('\n--- Checking Proposal Items ---');
    // We need to find proposals first, then their items.
    const { data: proposals } = await supabase.from('proposals').select('id, title').eq('deal_id', dealId);
    
    if (proposals && proposals.length > 0) {
        const propIds = proposals.map(p => p.id);
        const { data: items, error: itemsError } = await supabase
            .from('proposal_items')
            .select('*')
            .in('proposal_id', propIds);
            
        if (!itemsError && items) {
            console.log(`Found ${items.length} items across ${proposals.length} proposals.`);
            // Group by proposal and show names
            const grouped = items.reduce((acc, item) => {
                if (!acc[item.proposal_id]) acc[item.proposal_id] = [];
                acc[item.proposal_id].push(item.name || item.product_name);
                return acc;
            }, {});
            console.log(JSON.stringify(grouped, null, 2));
        }
    }
}

recoverProducts();
