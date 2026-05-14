
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Environment variables missing!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDealAndProposals() {
    // Search for the deal by title
    const { data: deals, error: dealError } = await supabase
        .from('deals')
        .select('id, title, organization_id')
        .ilike('title', '%Virtuozzo%')
        .limit(5);

    if (dealError) {
        console.error('Error fetching deals:', dealError);
        return;
    }

    console.log('Found Deals:', JSON.stringify(deals, null, 2));

    if (deals && deals.length > 0) {
        const dealId = deals[0].id;
        const orgId = deals[0].organization_id;
        
        // Fetch proposals for this deal
        const { data: proposals, error: propError } = await supabase
            .from('proposals')
            .select('*')
            .eq('deal_id', dealId)
            .order('created_at', { ascending: false });

        if (propError) {
            console.error('Error fetching proposals:', propError);
        } else {
            console.log('Found Proposals:', JSON.stringify(proposals.map(p => ({
                id: p.id,
                title: p.title,
                created_at: p.created_at,
                has_content: !!p.content
            })), null, 2));
            
            if (proposals.length > 0 && proposals[0].content) {
                console.log('--- CONTENT SNAPSHOT ---');
                // Proposals content is often a JSON or HTML. Let's see.
                const content = proposals[0].content;
                if (typeof content === 'string') {
                    console.log(content.substring(0, 2000));
                } else {
                    console.log(JSON.stringify(content, null, 2).substring(0, 2000));
                }
            }
        }

        // Also check if there are ANY products for this deal with quote_id IS NULL
        const { data: nullProducts, error: npError } = await supabase
            .from('deal_products')
            .select('*')
            .eq('deal_id', dealId)
            .is('quote_id', null);

        if (!npError) {
            console.log(`Found ${nullProducts.length} products with null quote_id for this deal.`);
            if (nullProducts.length > 0) {
                console.log('Null Products:', JSON.stringify(nullProducts.map(p => p.name), null, 2));
            }
        }
        
        // check total products for deal
        const { data: allProducts } = await supabase
            .from('deal_products')
            .select('id, name, quote_id')
            .eq('deal_id', dealId);
        console.log(`Total products for deal: ${allProducts?.length}`);
        console.log('Products:', JSON.stringify(allProducts, null, 2));
    }
}

checkDealAndProposals();
