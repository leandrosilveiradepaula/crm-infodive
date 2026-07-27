const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
        const env = fs.readFileSync('c:/Users/Leandro Silveira/Documents/crm-next/.env.local', 'utf8');
        env.split('\n').forEach(line => {
            const [key, ...val] = line.split('=');
            if (key && val) process.env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
        });
    } catch (e) { }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
    console.log("=== Fetching deals in 'proposal' or 'negotiation' stage ===");
    const { data: deals, error: dErr } = await supabase
        .from('deals')
        .select('*')
        .in('stage', ['proposal', 'negotiation']);
    
    if (dErr) {
        console.error("Error fetching deals:", dErr);
        return;
    }

    console.log(`Found ${deals.length} deals in proposal/negotiation.`);
    if (deals.length === 0) {
        console.log("No deals found to test.");
        return;
    }

    // Print deals
    deals.forEach(d => {
        console.log(`- Deal ID: ${d.id}, Title: "${d.title}", Stage: "${d.stage}", OrgID: "${d.organization_id}", OwnerID: "${d.owner_id}"`);
    });

    const targetDeal = deals.find(d => d.stage === 'proposal');
    if (!targetDeal) {
        console.log("No deal in 'proposal' stage to test update.");
        return;
    }

    console.log(`\n=== Simulating update for deal "${targetDeal.title}" (${targetDeal.id}) to stage 'negotiation' ===`);
    
    // We will simulate the update using service role first to see if it works,
    // and then check if there are any database constraints or triggers that fail.
    const updates = {
        stage: 'negotiation',
        probability: 75
    };

    const { data, error } = await supabase
        .from('deals')
        .update(updates)
        .eq('id', targetDeal.id)
        .select();

    if (error) {
        console.error("Update failed:", error);
    } else {
        console.log("Update succeeded!", data);
        
        // Revert it back to proposal
        console.log("Reverting deal stage back to 'proposal'...");
        await supabase
            .from('deals')
            .update({ stage: 'proposal', probability: 50 })
            .eq('id', targetDeal.id);
    }
}

testUpdate();
