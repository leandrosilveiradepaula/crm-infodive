'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import type { ColumnMapping, ParsedRow } from '@/utils/excelParser';

export interface PriceList {
    id: string;
    name: string;
    manufacturer: string;
    uploaded_at: string;
    file_name: string;
    total_products: number;
    updated_products: number;
    created_products: number;
    errors?: any;
}

export interface PriceListTemplate {
    id: string;
    manufacturer: string;
    column_mapping: ColumnMapping;
}

import { requirePermission, requireSessionContext } from '@/lib/auth-server';

export async function getPriceLists() {
    try {
        const { organizationId } = await requireSessionContext();
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('price_lists')
            .select('*')
            .eq('organization_id', organizationId)
            .order('uploaded_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching price lists:', error);
        return { success: false, error: error.message };
    }
}

export async function saveTemplateAction(manufacturer: string, mapping: ColumnMapping) {
    try {
        const { organizationId } = await requirePermission('products:edit');
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('price_list_templates')
            .upsert({
                manufacturer,
                organization_id: organizationId,
                column_mapping: mapping,
                updated_at: new Date().toISOString()
            }, { onConflict: 'manufacturer,organization_id' });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Failed to save template:', error);
        return { success: false, error: error.message };
    }
}

export async function getTemplateAction(manufacturer: string) {
    try {
        const { organizationId } = await requireSessionContext();
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('price_list_templates')
            .select('column_mapping')
            .eq('manufacturer', manufacturer)
            .eq('organization_id', organizationId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return { success: true, data: data?.column_mapping || null };
    } catch (error: any) {
        console.error('Error fetching template:', error);
        return { success: false, error: error.message };
    }
}

export async function importPriceListAction(
    name: string,
    manufacturer: string,
    fileName: string,
    products: ParsedRow[]
) {
    try {
        const { organizationId } = await requirePermission('products:edit');
        const supabase = createAdminClient();

        const { data: priceList, error: createError } = await supabase
            .from('price_lists')
            .insert({
                name,
                manufacturer,
                file_name: fileName,
                total_products: products.length,
                organization_id: organizationId
            })
            .select()
            .single();

        if (createError) throw createError;

        let updated = 0, created = 0;
        const errors: any[] = [];

        for (const product of products) {
            try {
                const { data: existing, error: fetchError } = await supabase
                    .from('products')
                    .select('id, cost')
                    .eq('sku', product.sku)
                    .eq('organization_id', organizationId)
                    .maybeSingle();

                if (fetchError) throw fetchError;

                if (existing) {
                    const { error: updateError } = await supabase
                        .from('products')
                        .update({
                            cost: product.cost,
                            name: product.name,
                            description: product.description,
                            category: product.category,
                            last_price_update: new Date().toISOString(),
                            price_list_id: priceList.id
                        })
                        .eq('id', existing.id)
                        .eq('organization_id', organizationId);

                    if (updateError) throw updateError;

                    if (existing.cost !== product.cost) {
                        await supabase.from('product_price_history').insert({
                            product_id: existing.id,
                            price_list_id: priceList.id,
                            old_cost: existing.cost,
                            new_cost: product.cost,
                            organization_id: organizationId
                        });
                    }

                    updated++;
                } else {
                    const { error: insertError } = await supabase.from('products').insert({
                        sku: product.sku,
                        name: product.name,
                        cost: product.cost,
                        description: product.description,
                        category: product.category,
                        last_price_update: new Date().toISOString(),
                        price_list_id: priceList.id,
                        organization_id: organizationId
                    });

                    if (insertError) throw insertError;
                    created++;
                }
            } catch (productError: any) {
                errors.push({ sku: product.sku, error: productError.message });
            }
        }

        await supabase
            .from('price_lists')
            .update({
                updated_products: updated,
                created_products: created,
                errors: errors.length > 0 ? errors : null
            })
            .eq('id', priceList.id)
            .eq('organization_id', organizationId);

        return { success: true, priceListId: priceList.id };
    } catch (error: any) {
        console.error('Error importing price list:', error);
        return { success: false, error: error.message };
    }
}

export async function deletePriceListAction(id: string) {
    try {
        const { organizationId } = await requirePermission('products:edit');
        const supabase = createAdminClient();
        const { error } = await supabase
            .from('price_lists')
            .delete()
            .eq('id', id)
            .eq('organization_id', organizationId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting price list:', error);
        return { success: false, error: error.message };
    }
}

