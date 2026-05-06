import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        console.log('--- AUTH USERS ---');
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;
        
        const userMap = new Map();
        users.forEach(u => {
            console.log(`${u.id} | ${u.email} | ${u.user_metadata?.full_name || 'N/A'}`);
            userMap.set(u.id, u);
        });

        console.log('\n--- PUBLIC PROFILES ---');
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('id, email, full_name, organization_id, status');
        if (profileError) throw profileError;

        const profileIds = new Set();
        profiles.forEach(p => {
            console.log(`${p.id} | ${p.email} | ${p.full_name} | Org: ${p.organization_id} | Status: ${p.status}`);
            profileIds.add(p.id);
        });

        console.log('\n--- DISCREPANCIES ---');
        users.forEach(u => {
            if (!profileIds.has(u.id)) {
                console.log(`MISSING PROFILE: ${u.email} (${u.id})`);
            }
        });

        const profilesWithoutAuth = profiles.filter(p => !userMap.has(p.id));
        profilesWithoutAuth.forEach(p => {
            console.log(`ORPHAN PROFILE: ${p.email} (${p.id})`);
        });

    } catch (err) {
        console.error('Diagnostic failed:', err.message);
    } finally {
        process.exit(0);
    }
}

run();
