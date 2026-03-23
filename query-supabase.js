const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
        const env = fs.readFileSync('.env.local', 'utf8');
        env.split('\n').forEach(line => {
            const [key, ...val] = line.split('=');
            if (key && val) process.env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
        });
    } catch (e) { }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: deals, error: dErr } = await supabase.from('deals').select('id, title, owner_id, owner').ilike('title', '%IBM%').limit(5);
    console.log("DEALS", deals, dErr);

    if (deals && deals.length > 0) {
        for (const deal of deals) {
            if (deal.owner_id) {
                const { data: profile } = await supabase.from('profiles').select('full_name, commission_rules').eq('id', deal.owner_id).single();
                console.log("PROFILE FOR OWNER", profile);
            }
        }
    }
}
check();
