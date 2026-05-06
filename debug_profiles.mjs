import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    try {
        console.log('--- Checking profiles table ---');
        const { data: firstProfile, error } = await supabase.from('profiles').select('*').limit(1);
        
        if (error) {
            console.error('Error fetching profiles:', error.message);
        } else if (firstProfile && firstProfile.length > 0) {
            console.log('Found profile. Columns:', Object.keys(firstProfile[0]).join(', '));
        } else {
            console.log('No profiles found in public.profiles.');
        }

        console.log('\n--- Checking for specific user ---');
        const { data: targetProfile, error: targetError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', 'crmantigravity02@gmail.com')
            .maybeSingle();

        if (targetError) {
            console.error('Error searching for user:', targetError.message);
        } else if (targetProfile) {
            console.log('Profile found for crmantigravity02@gmail.com:', targetProfile.id);
        } else {
            console.log('Profile NOT FOUND for crmantigravity02@gmail.com');
        }

    } catch (err) {
        console.error('Diagnostic error:', err.message);
    } finally {
        process.exit(0);
    }
}

run();
