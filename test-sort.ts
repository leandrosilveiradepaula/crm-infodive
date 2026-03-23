import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sortProductsHierarchically } from './src/utils/productSorting';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

(async () => {
    // 1. Fetch any product
    const { data: prod } = await supabase.from('deal_products')
        .select('id')
        .limit(1)
        .single();

    if (!prod) {
        console.log('No deal products found');
        return;
    }

    // 2. Try to update parent_id
    const { error } = await supabase.from('deal_products')
        .update({ parent_id: null })
        .eq('id', prod.id);

    console.log('UPDATE ERROR:', error);



})();
