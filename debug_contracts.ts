import { createAdminClient } from './src/lib/supabase/admin';

async function checkTable() {
    const supabase = createAdminClient();
    const { data: columns, error } = await supabase.rpc('get_table_columns', { table_name: 'contracts' });
    
    // Fallback if rpc doesn't exist: use a raw query if possible or just try to select
    const { data, error: selectError } = await supabase.from('contracts').select('organization_id').limit(1);
    
    if (selectError) {
        console.log('Error selecting organization_id:', selectError.message);
    } else {
        console.log('organization_id exists and is accessible.');
    }
}

checkTable();
