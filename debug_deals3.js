require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: deals, error } = await supabase.from('deals').select('id, title, created_at').order('created_at', { ascending: false }).limit(5);
    if (error) { console.log(error); return; }

    for (const deal of deals) {
        console.log(`\n\n--- Deal: ${deal.title} (${deal.created_at}) ---`);
        const { data: products } = await supabase.from('deal_products').select('id, name, description').eq('deal_id', deal.id);
        for (const p of products || []) {
            console.log(`\nProduct Name: ${p.name}`);
            if (p.description) {
                try {
                    const parsed = JSON.parse(p.description);
                    if (!Array.isArray(parsed)) continue;
                    const hidden = parsed.filter(i => i.is_visible_on_proposal === false);
                    console.log(`Desc - Total: ${parsed.length} | Hidden: ${hidden.length}`);
                    if (hidden.length > 0) {
                        const hNames = hidden.map(h => h.description).slice(0, 3).join(" | ");
                        console.log("Hidden:", hNames);
                    }
                } catch (e) { }
            }
        }
    }
}
run();
