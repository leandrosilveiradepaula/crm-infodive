'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requirePermission } from '@/lib/auth-server';

export interface AuditLog {
    id: string;
    user: string;
    action: string;
    details: string;
    category: 'auth' | 'system' | 'security' | 'lead' | 'deal';
    timestamp: string;
    ip: string;
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    const { organizationId } = await requirePermission('settings:view_audit');
    const supabase = createAdminClient();

    try {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error || !Array.isArray(data)) throw new Error('Audit rows unavailable');

        return data.map((item: Record<string, unknown>) => ({
            id: String(item.id ?? ''),
            user: String(item.user_name ?? ''),
            action: String(item.action ?? ''),
            details: String(item.details ?? ''),
            category: (['auth', 'system', 'security', 'lead', 'deal'].includes(String(item.category)) ? item.category : 'system') as AuditLog['category'],
            timestamp: String(item.created_at ?? ''),
            ip: String(item.ip_address ?? 'Não informado')
        }));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        throw new Error('Não foi possível carregar os registros de auditoria.');
    }
}

