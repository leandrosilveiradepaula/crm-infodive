import { createAdminClient } from '../lib/supabase/admin';
import { type Product } from '../types/product';
import { normalizeCasing } from '../lib/string-utils';

export class ProductService {
    private static readonly writableFields = new Set([
        'name', 'category', 'subcategory', 'brand', 'description',
        'sku', 'icon', 'margin', 'show_sku_on_proposal',
        // Historical catalog columns used by proposals and duplicateProduct.
        'price', 'cost',
    ]);

    static async getProducts(userId: string, organizationId: string): Promise<Product[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', organizationId)
            .order('name');

        if (error || !Array.isArray(data)) {
            console.error('[ProductService] products fetch failed');
            throw new Error('Não foi possível carregar os produtos.');
        }

        return data as Product[];
    }

    static async createProduct(userId: string, organizationId: string, product: Partial<Product>) {
        const supabase = createAdminClient();

        try {
            if (typeof product.name !== 'string' || !product.name.trim() || product.name.length > 250) {
                return { success: false, error: 'Nome do produto inválido.' };
            }
            const { data, error } = await supabase
                .from('products')
                .insert([{
                    organization_id: organizationId,
                    name: normalizeCasing(product.name, 'name'),
                    category: normalizeCasing(product.category || 'Hardware', 'name'),
                    subcategory: normalizeCasing(product.subcategory, 'name'),
                    brand: normalizeCasing(product.brand, 'name'),
                    description: product.description,
                    sku: product.sku,
                    show_sku_on_proposal: product.show_sku_on_proposal ?? true,
                    icon: product.icon || 'Server'
                }])
                .select()
                .single();

            if (error) throw error;
            if (!data) throw new Error('Product insert returned no row');

            return { success: true, data };
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('[ProductService] product creation failed');
            if (err.code === '23505' || err.message?.includes('products_sku_key')) {
                return { success: false, error: 'Este SKU já está cadastrado.' };
            }
            return { success: false, error: 'Não foi possível salvar o produto.' };
        }
    }

    static async updateProduct(userId: string, id: string, organizationId: string, updates: Partial<Product>) {
        const supabase = createAdminClient();

        try {
            if (typeof id !== 'string' || !id.trim() || !updates || typeof updates !== 'object' || Array.isArray(updates)) {
                return { success: false, error: 'Alteração de produto inválida.' };
            }
            if (updates.name !== undefined &&
                (typeof updates.name !== 'string' || !updates.name.trim() || updates.name.length > 250)) {
                return { success: false, error: 'Nome do produto inválido.' };
            }
            const normalizedUpdates: Record<string, unknown> = Object.fromEntries(
                Object.entries(updates).filter(([key]) => this.writableFields.has(key))
            );
            if (!Object.keys(normalizedUpdates).length) {
                return { success: false, error: 'Nenhuma alteração permitida.' };
            }
            for (const field of ['name', 'brand', 'category', 'subcategory'] as const) {
                const value = normalizedUpdates[field];
                if (typeof value === 'string' && value) {
                    normalizedUpdates[field] = normalizeCasing(value, 'name');
                }
            }

            const { data: updated, error } = await supabase
                .from('products')
                .update(normalizedUpdates)
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select('id')
                .maybeSingle();

            if (error || !updated) throw error || new Error('Product update affected no row');
            return { success: true };
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('[ProductService] product update failed');
            if (err.code === '23505' || err.message?.includes('products_sku_key')) {
                return { success: false, error: 'Este SKU já está cadastrado.' };
            }
            return { success: false, error: 'Não foi possível atualizar o produto.' };
        }
    }

    static async deleteProduct(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        try {
            if (typeof id !== 'string' || !id.trim()) {
                return { success: false, error: 'Produto inválido.' };
            }
            const { data: deleted, error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .eq('organization_id', organizationId)
                .select('id')
                .maybeSingle();

            if (error || !deleted) throw error || new Error('Product delete affected no row');
            return { success: true };
        } catch {
            console.error('[ProductService] product deletion failed');
            return { success: false, error: 'Não foi possível excluir o produto.' };
        }
    }

    static async duplicateProduct(userId: string, organizationId: string, id: string) {
        const supabase = createAdminClient();

        try {
            const { data: original, error: fetchError } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .eq('organization_id', organizationId)
                .single();

            if (fetchError) throw fetchError;
            if (!original) throw new Error('Produto não encontrado');

            const newSku = `${original.sku || 'SKU'}-COPY-${crypto.randomUUID().slice(0, 8)}`;
            const newProduct = {
                organization_id: organizationId,
                name: `${original.name} (Cópia)`,
                category: original.category,
                subcategory: original.subcategory,
                brand: original.brand,
                description: original.description,
                sku: newSku,
                icon: original.icon,
                price: original.price,
                cost: original.cost,
                show_sku_on_proposal: original.show_sku_on_proposal
            };

            const { data, error: insertError } = await supabase
                .from('products')
                .insert([newProduct])
                .select()
                .single();

            if (insertError || !data) throw insertError || new Error('Product copy affected no row');
            return { success: true, data };
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('[ProductService] product duplication failed');
            if (err.code === '23505' || err.message?.includes('products_sku_key')) {
                return { success: false, error: 'Erro ao gerar SKU único para a cópia. Tente novamente.' };
            }
            return { success: false, error: 'Não foi possível duplicar o produto.' };
        }
    }
}
