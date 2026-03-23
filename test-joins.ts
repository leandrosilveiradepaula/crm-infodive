import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env: Record<string, string> = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1]] = match[2].trim();
    }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching one row from activities to see structure...");
    const { data: actData, error: actErr } = await supabase.from('activities').select('*').limit(1);
    console.log("Activities row:", actErr ? actErr.message : actData);

    console.log("Fetching one row from deal_activities to see structure...");
    const { data: daData, error: daErr } = await supabase.from('deal_activities').select('*').limit(1);
    console.log("deal_activities row:", daErr ? daErr.message : daData);
}
main();
