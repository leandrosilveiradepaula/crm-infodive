import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mpmhmjepmmpxbsmekldf.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbWhtamVwbW1weGJzbWVrbGRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ5NjgzMiwiZXhwIjoyMDgzMDcyODMyfQ.M9p9y9VqUGyCjXVb9OWnAVNNMg1aWHfBDueOLIpkyU0';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function findOrgId() {
    // Check deals table
    const { data: dealData } = await supabase.from('deals').select('organization_id').limit(1).not('organization_id', 'is', null);

    if (dealData && dealData.length > 0) {
        console.log(dealData[0].organization_id);
        return;
    }

    // Check accounts table
    const { data: accountData } = await supabase.from('accounts').select('organization_id').limit(1).not('organization_id', 'is', null);

    if (accountData && accountData.length > 0) {
        console.log(accountData[0].organization_id);
        return;
    }

    // Check organizations table (if it exists)
    const { data: orgData } = await supabase.from('organizations').select('id').limit(1);

    if (orgData && orgData.length > 0) {
        console.log(orgData[0].id);
        return;
    }

    console.log('NOT_FOUND');
}

findOrgId();
