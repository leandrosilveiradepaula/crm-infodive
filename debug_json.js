require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: deals, error } = await supabase.from('deals').select('id, title').order('created_at', { ascending: false }).limit(2);
    if (error) { console.error(error); return; }
    for (const deal of deals) {
        console.log(`\n\n--- Deal: ${deal.title} ---`);
        const { data: products } = await supabase.from('deal_products').select('id, name, description').eq('deal_id', deal.id);
        for (const p of products || []) {
            if (p.description) {
                try {
                    const parsed = JSON.parse(p.description);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log(`Product: ${p.name}`);
                        console.log(JSON.stringify(parsed[0], null, 2));
                    }
                } catch (e) { }
            }
        }
    }
}
run();
