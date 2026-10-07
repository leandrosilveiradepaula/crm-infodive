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

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            user: item.user_name,
            action: item.action,
            details: item.details,
            category: item.category as any,
            timestamp: item.created_at,
            ip: item.ip_address || '0.0.0.0'
        }));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}

