import { createAdminClient } from '@/lib/supabase/admin';
import { sortProductsHierarchically } from '@/utils/productSorting';
import { normalizeCasing } from '@/lib/string-utils';
import { Deal, DealProduct } from '@/types/deal';
import { Profile } from '@/types/profile';
import { Account } from '@/types/account';
import { Activity } from '@/types/activity';
import { mergeDealProductCurrencyFields, normalizeDealProductCurrencyFields } from './dealProductCurrencyPayload';

export interface PipelineData {
    deals: Deal[];
    profile: Profile | null;
    distributors: Account[];
    allAccounts: Account[];
}

/**
 * DealService handles all business logic and database interactions for Deals and Pipeline.
 * Uses service role client + explicit organization_id filter for tenant isolation.
 */
export class DealService {
    private static async canAccessAllDeals(
        supabase: ReturnType<typeof createAdminClient>,
        userId: string,
        organizationId: string,
    ): Promise<boolean> {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role, roles')
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (error || !profile) {
            throw new Error('Não foi possível validar o acesso às oportunidades.');
        }

        return profile.role === 'admin' ||
            profile.role === 'manager' ||
            (profile.roles || []).some((role: string) => ['admin', 'manager'].includes(role));
    }

    static async getPipelineData(userId: string, organizationId: string): Promise<PipelineData> {
        const supabase = createAdminClient();

        // 1. Resolve visibility from the current tenant only.
        const isAdminOrManager = await this.canAccessAllDeals(supabase, userId, organizationId);

        // 2. Fetch Deals with conditional filtering
        let query = supabase
            .from('deals')
            .select(`
                *,
                deal_products(*),
                account_data:accounts!deals_account_id_fkey(id, name)
            `)
            .eq('organization_id', organizationId);

        // Apply ownership filter for sales/vendors
        if (!isAdminOrManager) {
            query = query.eq('owner_id', userId);
        }

        const { data: deals, error } = await query.order('created_at', { ascending: false });

        if (error) {
            console.error('[DealService] pipeline data fetch failed');
            throw new Error('Não foi possível carregar o pipeline.');
        }

        // 3. Fetch tenant-scoped profiles for mapping.
        const { data: allProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, commission_rules')
            .eq('organization_id', organizationId);

        if (profilesError) {
            console.error('[DealService] pipeline profiles fetch failed');
            throw new Error('Não foi possível carregar os responsáveis pelas oportunidades.');
        }

        const profilesMap = (allProfiles || []).reduce((acc: Record<string, Profile>, p) => {
            acc[p.id] = p as Profile;
            return acc;
        }, {} as Record<string, Profile>);

        const profile = profilesMap[userId] || null;

        // 3. Map Data
        const finalDeals: Deal[] = (deals || []).map((d) => {
            const ownerProfile = profilesMap[d.owner_id] || null;
            return {
                ...d,
                owner_profile: ownerProfile,
                owner: ownerProfile?.full_name || d.owner || 'Desconhecido',
                company: (d as any).account_data?.name || d.company || 'Cliente',
                deal_products: sortProductsHierarchically(d.deal_products || [])
            } as Deal;
        });

        // 4. Fetch Distributors
        const { data: distributors, error: distError } = await supabase
            .from('accounts')
            .select('id, name, cnpj, payment_terms, logo_url, account_branches(id, name, cnpj), account_contacts(id, name, email, mobile_phone, landline_phone, role)')
            .eq('organization_id', organizationId)
            .eq('relationship_type', 'Distribuidor')
            .order('name');

        if (distError) {
            console.error('[DealService] pipeline distributors fetch failed');
            throw new Error('Não foi possível carregar os distribuidores.');
        }

        // 5. Fetch all accounts (for Manufacturer mapping)
        const { data: allAccounts, error: accountsError } = await supabase
            .from('accounts')
            .select('id, name, logo_url, relationship_type, account_contacts(id, name, email, mobile_phone, landline_phone, role)')
            .eq('organization_id', organizationId)
            .order('name');

        if (accountsError) {
            console.error('[DealService] pipeline accounts fetch failed');
            throw new Error('Não foi possível carregar as contas do pipeline.');
        }

        return {
            deals: finalDeals,
            profile: profile as Profile | null,
            distributors: (distributors || []) as unknown as Account[],
            allAccounts: (allAccounts || []) as unknown as Account[]
        };
    }

    static async getDealDetails(userId: string, dealId: string, organizationId: string): Promise<Deal | null> {
        const supabase = createAdminClient();

        // 1. Resolve visibility from the current tenant only.
        const isAdminOrManager = await this.canAccessAllDeals(supabase, userId, organizationId);

        // 2. Fetch deal with role-based restriction
        let query = supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .eq('organization_id', organizationId);
        
        if (!isAdminOrManager) {
            query = query.eq('owner_id', userId);
        }

        const { data: deal, error } = await query.maybeSingle();

        if (error) {
            console.error('[DealService] deal details fetch failed');
            throw new Error('Não foi possível carregar a oportunidade.');
        }
        if (!deal) return null;

        const { data: products, error: productsError } = await supabase
            .from('deal_products')
            .select('*')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .order('display_order', { ascending: true });
        if (productsError) {
            throw new Error('Não foi possível carregar os produtos da oportunidade.');
        }

        const { data: activities, error: activitiesError } = await supabase
            .from('activities')
            .select('*')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });
        if (activitiesError) {
            throw new Error('Não foi possível carregar as atividades da oportunidade.');
        }

        let account: Account | null = null;
        if (deal.account_id) {
            const { data: acc, error: accountError } = await supabase
                .from('accounts')
                .select('*')
                .eq('id', deal.account_id)
                .eq('organization_id', organizationId)
                .maybeSingle();
            if (accountError || !acc) {
                throw new Error('Não foi possível carregar a conta da oportunidade.');
            }

            const { data: contacts, error: contactsError } = await supabase
                .from('account_contacts')
                .select('*')
                .eq('account_id', acc.id)
                .eq('organization_id', organizationId);
            if (contactsError) {
                throw new Error('Não foi possível carregar os contatos da oportunidade.');
            }
            account = { ...(acc as any as Account), contacts: (contacts || []) as any };
        }

        let owner_profile: Profile | null = null;
        if (deal.owner_id) {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, commission_rules')
                .eq('id', deal.owner_id)
                .eq('organization_id', organizationId)
                .maybeSingle();
            if (profileError) {
                throw new Error('Não foi possível carregar o responsável pela oportunidade.');
            }
            if (profile) {
                owner_profile = profile as Profile;
            }
        }

        return {
            ...deal,
            owner_profile,
            deal_products: products ? sortProductsHierarchically(products as DealProduct[]) : [],
            deal_activities: (activities || []) as Activity[],
            account: account
        } as Deal;
    }

    static async createDeal(userId: string, organizationId: string, dealData: Partial<Deal>): Promise<Deal> {
        const supabase = createAdminClient();

        const payload = {
            title: normalizeCasing(dealData.title || '', 'title'),
            account_id: dealData.account_id || null,
            owner_id: userId,
            owner: dealData.owner || 'Me',
            company: normalizeCasing(dealData.company || '', 'name') || null,
            value: dealData.value || 0,
            stage: dealData.stage || 'qualification',
            probability: dealData.probability || 20,
            expected_close_date: dealData.expected_close_date || null,
            description: dealData.description || null,
            organization_id: organizationId
        };

        const { data, error } = await supabase.from('deals').insert([payload]).select().single();
        if (error) throw new Error('Não foi possível salvar a oportunidade.');
        return data as Deal;
    }

    static async updateDeal(userId: string, dealId: string, organizationId: string, updates: Partial<Deal>): Promise<Deal | null> {
        const supabase = createAdminClient();

        // Valid columns for the 'deals' table
        const allowedColumns = [
            'title', 'account_id', 'owner_id', 'owner', 'company', 'value', 'stage',
            'probability', 'expected_close_date', 'description', 'won_at', 'lost_at',
            'loss_reason', 'health_score', 'health_trend', 'risk_factors', 'tags',
            'billing_type', 'distributor_id', 'client_contact_id', 'lead_source',
            'next_step', 'commission_deduction', 'custom_fields'
        ];

        const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
            if (allowedColumns.includes(key)) {
                let val = value === '' ? null : value;
                if (key === 'title') val = normalizeCasing(val as string, 'title');
                if (key === 'company') val = normalizeCasing(val as string, 'name');
                acc[key] = val;
            }
            return acc;
        }, {} as Record<string, any>);

        if (Object.keys(sanitizedUpdates).length === 0) {
            console.warn('⚠️ No valid columns provided for deal update');
            return null;
        }

        const isAdminOrManager = await this.canAccessAllDeals(supabase, userId, organizationId);

        let query = supabase
            .from('deals')
            .update(sanitizedUpdates)
            .eq('id', dealId)
            .eq('organization_id', organizationId);
            
        if (!isAdminOrManager) {
            query = query.eq('owner_id', userId);
        }

        const { data, error } = await query.select().single();

        if (error) throw new Error('Não foi possível atualizar a oportunidade.');
        return data as Deal;
    }

    static async updateDealStage(userId: string, dealId: string, organizationId: string, newStage: string, probability?: number) {
        const supabase = createAdminClient();
        const updates: any = { stage: newStage };

        if (probability !== undefined) updates.probability = probability;
        if (newStage === 'won') { updates.won_at = new Date().toISOString(); updates.probability = 100; }
        else if (newStage === 'lost') { updates.lost_at = new Date().toISOString(); updates.probability = 0; }

        const isAdminOrManager = await this.canAccessAllDeals(supabase, userId, organizationId);

        let query = supabase
            .from('deals')
            .update(updates)
            .eq('id', dealId)
            .eq('organization_id', organizationId);

        if (!isAdminOrManager) {
            query = query.eq('owner_id', userId);
        }

        const { data, error } = await query.select().single();
        if (error) throw new Error('Não foi possível atualizar a etapa da oportunidade.');
        return data;
    }

    static async duplicateDeal(userId: string, dealId: string, organizationId: string): Promise<Deal> {
        const supabase = createAdminClient();

        // 1. Fetch only a deal the current user is allowed to read.
        const isAdminOrManager = await this.canAccessAllDeals(supabase, userId, organizationId);
        let originalDealQuery = supabase
            .from('deals')
            .select('*')
            .eq('id', dealId)
            .eq('organization_id', organizationId);

        if (!isAdminOrManager) {
            originalDealQuery = originalDealQuery.eq('owner_id', userId);
        }

        const { data: originalDeal, error: dealError } = await originalDealQuery.maybeSingle();

        if (dealError || !originalDeal) {
            throw new Error('Não foi possível duplicar a oportunidade.');
        }

        // 2. Fetch original products
        const { data: originalProducts, error: productsError } = await supabase
            .from('deal_products')
            .select('*')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId);

        if (productsError) {
            throw new Error('Não foi possível duplicar os produtos da oportunidade.');
        }

        // 3. Prepare duplicated deal data
        const { id, created_at, updated_at, ...baseDealData } = originalDeal;

        const duplicatedDealPayload = {
            ...baseDealData,
            title: `Cópia de ${originalDeal.title}`,
            owner_id: userId, // Current user becomes the owner of the copy
            won_at: null,
            lost_at: null,
            loss_reason: null,
            days_in_stage: 0,
            organization_id: organizationId // Explicit SaaS Multitenant attribution
            // Stage remains the same as requested, and other relation IDs remain untouched
        };

        const { data: newDeal, error: insertDealError } = await supabase
            .from('deals')
            .insert([duplicatedDealPayload])
            .select()
            .single();

        if (insertDealError || !newDeal) {
            throw new Error('Não foi possível duplicar a oportunidade.');
        }

        // 4. Duplicate Products if any
        if (originalProducts && originalProducts.length > 0) {
            const duplicatedProductsPayload = originalProducts.map(p => {
                const { id, created_at, updated_at, ...baseProductData } = p;
                return {
                    ...baseProductData,
                    ...normalizeDealProductCurrencyFields(p),
                    deal_id: newDeal.id, // Link to the newly duplicated deal
                    organization_id: organizationId // Explicit SaaS Multitenant attribution
                };
            });

            const { error: insertProductsError } = await supabase
                .from('deal_products')
                .insert(duplicatedProductsPayload);

            if (insertProductsError) {
                console.error('[DealService] deal product duplication failed');
                const { data: rolledBack, error: rollbackError } = await supabase
                    .from('deals')
                    .delete()
                    .eq('id', newDeal.id)
                    .eq('organization_id', organizationId)
                    .select('id')
                    .maybeSingle();

                if (rollbackError || !rolledBack) {
                    console.error('[DealService] duplicated deal rollback failed');
                    throw new Error('Não foi possível concluir nem reverter a duplicação da oportunidade.');
                }

                throw new Error('Não foi possível duplicar os produtos da oportunidade.');
            }
        }

        return newDeal as Deal;
    }

    static async addDealProduct(userId: string, dealId: string, organizationId: string, productData: Partial<DealProduct>): Promise<DealProduct> {
        const supabase = createAdminClient();

        const payload = {
            deal_id: dealId,
            organization_id: organizationId,
            product_id: productData.product_id || productData.id,
            name: productData.name,
            unit_price: productData.unit_price || 0,
            quantity: typeof productData.quantity === 'number' ? productData.quantity : 1,
            cost: productData.cost || 0,
            sku: productData.sku || '',
            description: productData.description || '',
            margin: productData.margin || 0,
            manufacturer: productData.manufacturer || '',
            category: productData.category || '',
            subcategory: productData.subcategory || '',
            is_bid: productData.is_bid || false,
            ...normalizeDealProductCurrencyFields(productData),
            billing_type: productData.billing_type || 'indirect',
            distributor_id: productData.distributor_id || null,
            distributor_cnpj: productData.distributor_cnpj || null,
            pricing_model: productData.pricing_model || 'one_time'
        };

        const { data, error } = await supabase.from('deal_products').insert([payload]).select().single();
        if (error) throw new Error('Não foi possível adicionar o produto à oportunidade.');
        return data as DealProduct;
    }

    static async updateDealProduct(userId: string, itemId: string, organizationId: string, updates: Partial<DealProduct>): Promise<DealProduct> {
        const supabase = createAdminClient();
        const currencyKeys: Array<keyof DealProduct> = ['is_usd', 'usd_cost', 'exchange_rate', 'present_in_usd'];
        const touchesCurrencyState = currencyKeys.some(key => Object.prototype.hasOwnProperty.call(updates, key));

        let safeUpdates: Record<string, unknown> = { ...updates };

        if (touchesCurrencyState) {
            const { data: current, error: currentError } = await supabase
                .from('deal_products')
                .select('is_usd, usd_cost, exchange_rate, present_in_usd')
                .eq('id', itemId)
                .eq('organization_id', organizationId)
                .single();

            if (currentError || !current) {
                throw new Error('Não foi possível atualizar o produto da oportunidade.');
            }

            safeUpdates = {
                ...safeUpdates,
                ...mergeDealProductCurrencyFields(current, updates),
            };
        }

        const { data, error } = await supabase
            .from('deal_products')
            .update(safeUpdates)
            .eq('id', itemId)
            .eq('organization_id', organizationId)
            .select()
            .single();
        if (error) throw new Error('Não foi possível atualizar o produto da oportunidade.');
        return data as DealProduct;
    }

    static async removeDealProduct(userId: string, itemId: string, organizationId: string) {
        if (typeof itemId !== 'string' || !itemId.trim()) {
            throw new Error('Produto da oportunidade inválido.');
        }

        const supabase = createAdminClient();
        const { data: deleted, error } = await supabase
            .from('deal_products')
            .delete()
            .eq('id', itemId)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        if (error || !deleted) throw new Error('Não foi possível remover o produto da oportunidade.');
        return true;
    }

    static async bulkRemoveDealProducts(userId: string, itemIds: string[], organizationId: string) {
        const normalizedIds = [...new Set(itemIds.map(id => typeof id === 'string' ? id.trim() : '').filter(Boolean))];
        if (!itemIds.length || normalizedIds.length !== itemIds.length) {
            throw new Error('Lista de produtos da oportunidade inválida.');
        }

        const supabase = createAdminClient();
        const { data: deleted, error } = await supabase
            .from('deal_products')
            .delete()
            .in('id', normalizedIds)
            .eq('organization_id', organizationId)
            .select('id');

        const deletedIds = new Set((deleted || []).map(item => String(item.id)));
        if (error || normalizedIds.some(id => !deletedIds.has(id))) {
            throw new Error('Não foi possível atualizar os produtos da oportunidade.');
        }
        return true;
    }

    static async reorderDealProducts(userId: string, organizationId: string, items: { id: string, display_order: number }[]) {
        const ids = items.map(item => typeof item.id === 'string' ? item.id.trim() : '');
        if (!items.length || ids.some(id => !id) || new Set(ids).size !== ids.length ||
            items.some(item => !Number.isInteger(item.display_order) || item.display_order < 0)) {
            throw new Error('Ordenação de produtos inválida.');
        }

        const supabase = createAdminClient();
        const results = await Promise.all(items.map(item =>
            supabase
                .from('deal_products')
                .update({ display_order: item.display_order })
                .eq('id', item.id)
                .eq('organization_id', organizationId)
                .select('id')
                .maybeSingle()
        ));

        if (results.some(result => result.error || !result.data)) {
            throw new Error('Falha ao reordenar alguns produtos');
        }
        return true;
    }

    static async bulkAddDealProducts(userId: string, dealId: string, organizationId: string, products: any[]): Promise<DealProduct[]> {
        const supabase = createAdminClient();

        const isValidUUID = (id: any) =>
            typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        const potentialProductIds = products.map(p => p.product_id || p.external_id).filter(id => isValidUUID(id));
        const validProductIds = new Set<string>();

        if (potentialProductIds.length > 0) {
            const { data: existingProducts, error: verifyError } = await supabase
                .from('products')
                .select('id')
                .in('id', potentialProductIds)
                .eq('organization_id', organizationId);
            if (!verifyError && existingProducts) existingProducts.forEach(p => validProductIds.add(p.id));
        }

        const payload = products.map(p => {
            const candidateId = p.product_id || p.external_id || p.id;
            const finalProductId = (isValidUUID(candidateId) && validProductIds.has(candidateId)) ? candidateId : null;
            const finalExternalId = p.external_id || (candidateId !== finalProductId && isValidUUID(candidateId) ? candidateId : null);
            const unitPrice = typeof p.unit_price === 'number' ? p.unit_price : (parseFloat(String(p.unit_price || p.price || 0).replace(/[^0-9.-]+/g, "")) || 0);
            const quantity = typeof p.quantity === 'number' ? p.quantity : (parseFloat(String(p.quantity || 1)) || 1);
            const cost = typeof p.cost === 'number' ? p.cost : (parseFloat(String(p.cost || 0).replace(/[^0-9.-]+/g, "")) || 0);
            const margin = typeof p.margin === 'number' ? p.margin : (parseFloat(String(p.margin || 0)) || 0);

            return {
                deal_id: dealId,
                organization_id: organizationId,
                product_id: finalProductId,
                external_id: finalExternalId,
                name: p.name || 'Produto Sem Nome',
                unit_price: unitPrice,
                quantity,
                cost,
                sku: p.sku || '',
                description: typeof p.description === 'string' ? p.description : JSON.stringify(p.description || ''),
                margin,
                manufacturer: p.manufacturer || '',
                category: p.category || '',
                subcategory: p.subcategory || '',
                distributor_id: isValidUUID(p.distributor_id) ? p.distributor_id : null,
                ...normalizeDealProductCurrencyFields(p),
                is_bid: !!p.is_bid,
                bid_number: p.bid_number || null,
                bid_validity: p.bid_validity || null,
                display_order: p.display_order || 999,
                billing_type: p.billing_type || 'indirect',
                distributor_cnpj: p.distributor_cnpj || null,
                pricing_model: p.pricing_model || 'one_time'
            };
        });

        const { data, error } = await supabase.from('deal_products').insert(payload).select();
        if (error) throw new Error('Não foi possível atualizar os produtos da oportunidade.');
        return (data || []) as DealProduct[];
    }

    static async getOrCreateRoom(userId: string, dealId: string, organizationId: string): Promise<{ room?: any, error?: string }> {
        const supabase = createAdminClient();

        // 1. Double check the deal belongs to the organization first (security)
        const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('id')
            .eq('id', dealId)
            .eq('organization_id', organizationId)
            .single();

        if (dealError || !deal) {
            console.error('[DealService] deal room deal fetch failed');
            return { error: 'Acesso negado ou oportunidade não encontrada' };
        }

        const { data: existing, error: fetchError } = await supabase
            .from('deal_rooms')
            .select('*')
            .eq('deal_id', dealId)
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (fetchError) {
            console.error('[DealService] deal room fetch failed');
            return { error: 'Não foi possível acessar a sala da oportunidade.' };
        }

        if (existing) return { room: existing };

        // 3. Try to insert with organization_id
        const { data: newRoom, error: insertError } = await supabase
            .from('deal_rooms')
            .insert([{ deal_id: dealId, organization_id: organizationId }])
            .select()
            .single();

        if (insertError) {
            console.error('[DealService] deal room creation failed');
            return { error: 'Não foi possível criar a sala da oportunidade.' };
        }

        return { room: newRoom };
    }
}
