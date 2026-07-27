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

const userId = 'e3aaa21b-30ee-4bc1-9db2-289a8fb00d07';
const dealId = 'dab81bbc-e69d-4523-bbbd-8d0c52fee72d';
const organizationId = 'b4366e33-b8d5-4cbc-a7a7-8bd607031931';
const newStage = 'negotiation';

async function simulate() {
    console.log("=== Fetching profile ===");
    const { data: profile_role, error: pErr } = await supabase
        .from('profiles')
        .select('role, roles')
        .eq('id', userId)
        .single();
    
    if (pErr) {
        console.error("Profile fetch error:", pErr);
        return;
    }
    console.log("Profile role/roles:", profile_role);

    const isAdminOrManager = profile_role?.role === 'admin' || 
                           profile_role?.role === 'manager' ||
                           (profile_role?.roles || []).some((r) => ['admin', 'manager'].includes(r));
    
    console.log("isAdminOrManager:", isAdminOrManager);

    const updates = { stage: newStage, probability: 75 };

    let query = supabase
        .from('deals')
        .update(updates)
        .eq('id', dealId)
        .eq('organization_id', organizationId);

    if (!isAdminOrManager) {
        query = query.eq('owner_id', userId);
    }

    console.log("=== Running update simulation ===");
    const { data, error } = await query.select().single();
    if (error) {
        console.error("Update simulated error:", error.message, error);
    } else {
        console.log("Update simulated success! Data:", data);
        // revert
        await supabase.from('deals').update({ stage: 'proposal', probability: 50 }).eq('id', dealId);
    }
}

simulate();
