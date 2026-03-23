
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function debug() {
    const envPath = path.join(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const url = env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Testing with URL:', url);
    const supabase = createClient(url, key);

    const token = 'eedd5103ea46381f075b9df5ceb18493';
    console.log('Testing Token:', token);

    try {
        const { data, error } = await supabase.rpc('get_deal_room_by_token', {
            token_input: token
        });

        if (error) {
            console.log('❌ RPC ERROR:', JSON.stringify(error, null, 2));
        } else {
            console.log('✅ RPC SUCCESS:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.log('❌ CRITICAL ERROR:', e);
    }
}

debug();
