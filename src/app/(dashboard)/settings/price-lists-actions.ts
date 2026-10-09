'use server';

import { createAdminClient } from '../../../lib/supabase/admin';
import type { ColumnMapping, ParsedRow } from '../../../utils/excelParser';

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

import { requirePermission, requireSessionContext } from '../../../lib/auth-server';

export async function getPriceLists() {
    try {
        const { organizationId } = await requireSessionContext();
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('price_lists')
            .select('*')
            .eq('organization_id', organizationId)
            .order('uploaded_at', { ascending: false });

        if (error || !Array.isArray(data)) throw new Error('Invalid list');
        return { success: true, data };
    } catch (error: any) {
        console.error('Error fetching price lists:', error);
        return { success: false, error: error.message };
    }
}

export async function saveTemplateAction(manufacturer: string, mapping: ColumnMapping) {
    try {
        const { organizationId } = await requirePermission('products:edit');
        if (typeof manufacturer !== 'string' || !manufacturer.trim() || manufacturer.length > 160 ||
            !mapping || typeof mapping !== 'object' || Array.isArray(mapping) ||
            Object.values(mapping).some(value => value !== undefined && (typeof value !== 'string' || value.length > 160))) {
            return { success: false, error: 'Modelo de lista inválido.' };
        }
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('price_list_templates')
            .upsert({
                manufacturer,
                organization_id: organizationId,
                column_mapping: mapping,
                updated_at: new Date().toISOString()
            }, { onConflict: 'manufacturer,organization_id' }).select('id').maybeSingle();

        if (error || !data) throw new Error('Template not persisted');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to save template:', error);
        return { success: false, error: error.message };
    }
}

export async function getTemplateAction(manufacturer: string) {
    try {
        const { organizationId } = await requireSessionContext();
        if (typeof manufacturer !== 'string' || !manufacturer.trim()) return { success: false, error: 'Fabricante inválido.' };
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('price_list_templates')
            .select('column_mapping').eq('manufacturer', manufacturer.trim())
            .eq('organization_id', organizationId).maybeSingle();
        if (error) throw error;
        if (!data) return { success: true, data: null };
        if (!data.column_mapping || typeof data.column_mapping !== 'object' || Array.isArray(data.column_mapping)) {
            throw new Error('Malformed template');
        }
        return { success: true, data: data.column_mapping };
    } catch {
        return { success: false, error: 'Não foi possível carregar o modelo de preços.' };
    }
}

export async function importPriceListAction(
    name: string, manufacturer: string, fileName: string, products: ParsedRow[]
) {
    try {
        const { organizationId } = await requirePermission('products:edit');
        if ([name, manufacturer, fileName].some(value => typeof value !== 'string' || !value.trim() || value.length > 200) ||
            !Array.isArray(products) || products.length === 0 || products.length > 10000 ||
            products.some(product => !product || typeof product.sku !== 'string' || !product.sku.trim() ||
                product.sku.length > 160 || typeof product.name !== 'string' || !product.name.trim() ||
                product.name.length > 240 || typeof product.cost !== 'number' || !Number.isFinite(product.cost) ||
                product.cost < 0 || (product.description !== undefined && typeof product.description !== 'string') ||
                (product.category !== undefined && typeof product.category !== 'string'))) {
            return { success: false, error: 'Lista de preços inválida.' };
        }
        const supabase = createAdminClient();
        const { data: priceList, error: createError } = await supabase.from('price_lists')
            .insert({ name: name.trim(), manufacturer: manufacturer.trim(),
                file_name: fileName.trim(), total_products: products.length,
                organization_id: organizationId })
            .select('id').maybeSingle();
        if (createError || !priceList) throw new Error('Price list not persisted');

        let updated = 0;
        let created = 0;
        const errors: { sku: string; error: string }[] = [];
        for (const product of products) {
            try {
                const { data: existing, error: lookupError } = await supabase.from('products')
                    .select('id, cost').eq('sku', product.sku)
                    .eq('organization_id', organizationId).maybeSingle();
                if (lookupError) throw new Error('Product lookup failed');

                if (existing) {
                    const { data: changed, error: updateError } = await supabase.from('products')
                        .update({ cost: product.cost, name: product.name,
                            description: product.description, category: product.category,
                            last_price_update: new Date().toISOString(), price_list_id: priceList.id })
                        .eq('id', existing.id).eq('organization_id', organizationId)
                        .select('id').maybeSingle();
                    if (updateError || !changed) throw new Error('Product update not persisted');
                    if (existing.cost !== product.cost) {
                        const { error: historyError } = await supabase.from('product_price_history').insert({
                            product_id: existing.id, price_list_id: priceList.id,
                            old_cost: existing.cost, new_cost: product.cost, organization_id: organizationId,
                        });
                        if (historyError) throw new Error('Price history not persisted');
                    }
                    updated++;
                } else {
                    const { data: inserted, error: insertError } = await supabase.from('products')
                        .insert({ sku: product.sku, name: product.name, cost: product.cost,
                            description: product.description, category: product.category,
                            last_price_update: new Date().toISOString(),
                            price_list_id: priceList.id, organization_id: organizationId })
                        .select('id').maybeSingle();
                    if (insertError || !inserted) throw new Error('Product insert not persisted');
                    created++;
                }
            } catch {
                errors.push({ sku: product.sku, error: 'Falha ao gravar ou auditar o produto.' });
            }
        }
        const { data: finalized, error: finalError } = await supabase.from('price_lists')
            .update({ updated_products: updated, created_products: created,
                errors: errors.length ? errors : null })
            .eq('id', priceList.id).eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (finalError || !finalized) return { success: false, error: 'Não foi possível finalizar a importação.', priceListId: priceList.id };
        if (errors.length) return { success: false, error: 'Importação parcial. Verifique os erros registrados na lista.', priceListId: priceList.id };
        return { success: true, priceListId: priceList.id };
    } catch {
        return { success: false, error: 'Não foi possível importar a lista de preços.' };
    }
}

export async function deletePriceListAction(id: string) {
    try {
        const { organizationId } = await requirePermission('products:edit');
        if (typeof id !== 'string' || !id.trim()) return { success: false, error: 'Lista inválida.' };
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('price_lists').delete()
            .eq('id', id.trim()).eq('organization_id', organizationId)
            .select('id').maybeSingle();
        if (error || !data) throw new Error('Price list not deleted');
        return { success: true };
    } catch {
        return { success: false, error: 'Não foi possível excluir a lista de preços.' };
    }
}
