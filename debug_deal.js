require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "OK" : "MISSING");
    const { data: deals, error: dealError } = await supabase.from('deals').select('id, title, organization_id').or('title.ilike.%P10%,title.ilike.%IBM%,title.ilike.%Servidor%').limit(10);

    if (dealError) {
        console.error("Deal error:", dealError);
        return;
    }

    console.log("Deals:", deals ? deals.map(d => d.title) : "No deals found");

    if (deals && deals.length > 0) {
        for (const deal of deals) {
            const { data: products } = await supabase.from('deal_products').select('*').eq('deal_id', deal.id);
            if (products && products.length > 0) {
                const p = products.find(prod => prod.name.includes('P10 S1022s') || prod.name.includes('Servidor'));
                if (p) {
                    console.log(`\n\n--- Deal: ${deal.title} ---`);
                    console.log("Product Name:", p.name);
                    console.log("Product Tech Details exists:", !!p.tech_details);
                    console.log("\nDescription field content type:", typeof p.description);
                    if (p.description) {
                        console.log("Description string length:", p.description.length);
                        console.log("Starts with [?:", p.description.trim().startsWith('['));
                        console.log("Description snippet:", p.description.substring(0, 500));
                        try {
                            const parsed = JSON.parse(p.description);
                            console.log("Description IS valid JSON. Items count:", parsed.length);
                            const hidden = parsed.filter(i => i.is_visible_on_proposal === false);
                            console.log("Hidden items in description count:", hidden.length);
                            if (hidden.length > 0) {
                                console.log("Example hidden item:", hidden[0]);
                            }
                        } catch (e) {
                            console.log("Failed to parse description JSON:", e.message);
                        }
                    } else {
                        console.log("Description is empty/null");
                    }

                    if (p.tech_details) {
                        try {
                            const parsed = JSON.parse(p.tech_details);
                            console.log("Tech details IS valid JSON. Items count:", parsed.length);
                            const hidden = parsed.filter(i => i.is_visible_on_proposal === false);
                            console.log("Hidden items in tech_details count:", hidden.length);
                        } catch (e) {
                            console.log("Failed to parse tech_details JSON:", e.message);
                        }
                    }
                }
            }
        }
    }
}
run();
