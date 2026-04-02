import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        console.log('Fetching Leandro Org ID...');
        const { data: leandroProfile, error: lError } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('email', 'leandro.silveira@infodive.com.br')
            .single();
            
        if (lError || !leandroProfile?.organization_id) {
            console.error('FAILED to find Leandro organization ID.');
            process.exit(1);
        }
        
        const targetOrgId = leandroProfile.organization_id;
        const targetEmail = 'crmantigravity02@gmail.com';
        
        console.log('Found Org ID:', targetOrgId);
        
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.email === targetEmail);
        
        if (!user) {
            console.error('Target user not found in auth.');
            process.exit(1);
        }
        
        console.log('Fixing Profile (public.profiles)...');
        await supabase.from('profiles').update({ organization_id: targetOrgId }).eq('id', user.id);
        
        console.log('Fixing User Metadata (auth.users)...');
        await supabase.auth.admin.updateUserById(user.id, {
            user_metadata: { ...user.user_metadata, organization_id: targetOrgId }
        });
        
        console.log('User FIX COMPLETE for', targetEmail);
        
    } catch (err) {
        console.error('Fatal error during fix:', err.message);
    } finally {
        process.exit(0);
    }
}

run();
