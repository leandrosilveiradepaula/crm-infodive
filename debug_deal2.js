require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: deals } = await supabase.from('deals').select('id, title').order('updated_at', { ascending: false }).limit(2);
    if (deals && deals.length > 0) {
        for (const deal of deals) {
            console.log(`\n\n--- Deal: ${deal.title} ---`);
            const { data: products } = await supabase.from('deal_products').select('id, name, description').eq('deal_id', deal.id);
            for (const p of products || []) {
                console.log(`\nProduct Name: ${p.name}`);
                if (p.description) {
                    try {
                        const parsed = JSON.parse(p.description);
                        const hidden = parsed.filter(i => i.is_visible_on_proposal === false);
                        console.log(`Description - Total: ${parsed.length} | Hidden: ${hidden.length}`);
                        if (hidden.length > 0) {
                            console.log("Example hidden (first 2):", JSON.stringify(hidden.slice(0, 2)));
                        }
                    } catch (e) {
                        console.log("Not JSON");
                    }
                } else {
                    console.log("Empty description");
                }
            }
        }
    }
}
run().catch(console.error);
