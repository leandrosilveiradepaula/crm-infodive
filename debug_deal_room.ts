
import { createAdminClient } from './src/lib/supabase/admin';

async function testCreateRoom() {
    const supabase = createAdminClient();

    // Pegar o primeiro deal disponível para teste
    const { data: firstDeal } = await supabase.from('deals').select('id, organization_id').limit(1).single();

    if (!firstDeal) {
        console.error('No deals found to test');
        return;
    }

    console.log(`Testing create room for deal ${firstDeal.id}...`);

    // Verificar se já existe
    const { data: existing } = await supabase
        .from('deal_rooms')
        .select('*')
        .eq('deal_id', firstDeal.id)
        .eq('organization_id', firstDeal.organization_id)
        .maybeSingle();

    if (existing) {
        console.log('Room already exists:', existing);
        return;
    }

    const { data, error } = await supabase
        .from('deal_rooms')
        .insert([{
            deal_id: firstDeal.id,
            organization_id: firstDeal.organization_id
        }])
        .select()
        .single();

    if (error) {
        console.error('Error inserting:', error);
    } else {
        console.log('Success inserting:', data);
    }
}

testCreateRoom();
