import { createAdminClient } from '@/lib/supabase/admin';
import { type Product } from '@/types/product';
import { normalizeCasing } from '@/lib/string-utils';

export class ProductService {
    static async getProducts(userId: string, organizationId: string): Promise<Product[]> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', organizationId)
            .order('name');

        if (error) {
            console.error('Error fetching products:', error);
            return [];
        }

        return data as Product[];
    }

    static async createProduct(userId: string, organizationId: string, product: Partial<Product>) {
        const supabase = createAdminClient();

        try {
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

            return { success: true, data };
        } catch (error: any) {
            const err = error as { code?: string; message?: string };
            console.error('Error creating product:', err);
            if (err.code === '23505' || err.message?.includes('products_sku_key')) {
                return { success: false, error: 'Este SKU já está cadastrado.' };
            }
            return { success: false, error: err.message || 'Erro desconhecido' };
        }
    }

    static async updateProduct(userId: string, id: string, organizationId: string, updates: Partial<Product>) {
        const supabase = createAdminClient();

        try {
            const normalizedUpdates = { ...updates };
            if (updates.name) normalizedUpdates.name = normalizeCasing(updates.name, 'name');
            if (updates.brand) normalizedUpdates.brand = normalizeCasing(updates.brand, 'name');
            if (updates.category) normalizedUpdates.category = normalizeCasing(updates.category, 'name');
            if (updates.subcategory) normalizedUpdates.subcategory = normalizeCasing(updates.subcategory, 'name');

            const { error } = await supabase
                .from('products')
                .update(normalizedUpdates)
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;

            return { success: true };
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('Error updating product:', err);
            if (err.code === '23505' || err.message?.includes('products_sku_key')) {
                return { success: false, error: 'Este SKU já está cadastrado.' };
            }
            return { success: false, error: err.message || 'Erro desconhecido' };
        }
    }

    static async deleteProduct(userId: string, id: string, organizationId: string) {
        const supabase = createAdminClient();

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)
                .eq('organization_id', organizationId);

            if (error) throw error;

            return { success: true };
        } catch (error: unknown) {
            const err = error as { message?: string };
            console.error('Error deleting product:', err);
            return { success: false, error: err.message || 'Erro desconhecido' };
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

            const newSku = `${original.sku}-COPY-${Date.now().toString().slice(-4)}`;
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

            if (insertError) throw insertError;

            return { success: true, data };
        } catch (error: unknown) {
            const err = error as { code?: string; message?: string };
            console.error('Error duplicating product:', err);
            if (err.code === '23505' || err.message?.includes('products_sku_key')) {
                return { success: false, error: 'Erro ao gerar SKU único para a cópia. Tente novamente.' };
            }
            return { success: false, error: err.message || 'Erro desconhecido' };
        }
    }
}
