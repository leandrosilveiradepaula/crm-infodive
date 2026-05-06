import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        console.log('Searching for Claudio Villela...');
        const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) throw authError;

        const user = users.find(u => 
            u.user_metadata?.full_name?.toLowerCase().includes('claudio villela') || 
            u.email?.toLowerCase().includes('claudio')
        );

        if (!user) {
            console.log('User NOT found.');
            process.exit(0);
        }
        
        console.log('User found:', user.id, user.email, user.user_metadata?.full_name);
        
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
            console.error('Delete error:', deleteError.message);
        } else {
            console.log('User DELETED successfully from auth and cascade-deleted from profiles.');
        }

    } catch (err) {
        console.error('Fatal error during delete:', err.message);
    } finally {
        process.exit(0);
    }
}

run();
