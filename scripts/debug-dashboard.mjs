import { DashboardService } from '@/services/DashboardService';
import { createAdminClient } from '@/lib/supabase/admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
    const supabase = createAdminClient();
    
    // Fetch a real user/org from profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id')
        .limit(1)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
    }

    const { id: userId, organization_id: organizationId } = profile;
    
    console.log(`Testing getDashboardMetrics for userId: ${userId}, orgId: ${organizationId}...`);
    try {
        const metrics = await DashboardService.getDashboardMetrics(userId, organizationId);
        console.log('Metrics:', metrics);
    } catch (e) {
        console.error('Caught error:', e);
    }
}

test();
