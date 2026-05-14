
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectAudit() {
    const { data, error } = await supabase.from('audit_logs').select('*').limit(1);
    if (!error && data && data.length > 0) {
        console.log('Columns in audit_logs:', Object.keys(data[0]));
    } else {
        console.log('Error or no data:', error);
    }
}

inspectAudit();
