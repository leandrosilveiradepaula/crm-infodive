import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        console.log('Querying auth users...');
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        const user = users.find(u => u.email === 'crmantigravity02@gmail.com');
        if (!user) {
            console.log('User crmantigravity02@gmail.com NOT found in auth.users.');
            process.exit(0);
        }
        
        console.log('User ID found in auth:', user.id);
        console.log('User metadata:', JSON.stringify(user.user_metadata, null, 2));

        console.log('Checking profiles table...');
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id);
        
        if (error) {
            console.error('Database error checking profile:', error.message);
        } else if (profile.length === 0) {
            console.log('Profile NOT found in public.profiles. Attempting to create it now...');
            
            const orgId = user.user_metadata?.organization_id;
            const name = user.user_metadata?.full_name || 'Antigravity User';
            const role = user.user_metadata?.role || 'vendedor';

            const { error: insertError } = await supabase.from('profiles').insert({
                id: user.id,
                full_name: name,
                role: role,
                organization_id: orgId,
                status: 'active',
                updated_at: new Date().toISOString()
            });

            if (insertError) {
                console.error('FAILED to create profile:', insertError.message);
            } else {
                console.log('SUCCESS: Profile created for', user.id);
            }
        } else {
            console.log('Profile already exists:', JSON.stringify(profile[0], null, 2));
        }

    } catch (err) {
        console.error('Fatal error:', err.message);
    } finally {
        process.exit(0);
    }
}

run();
