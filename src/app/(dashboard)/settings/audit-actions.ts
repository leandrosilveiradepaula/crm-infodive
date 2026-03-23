'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireSessionContext } from '@/lib/auth-server';

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
    const { organizationId } = await requireSessionContext();
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

export async function createAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const { organizationId } = await requireSessionContext();
    const supabase = createAdminClient();

    try {
        const { error } = await supabase
            .from('audit_logs')
            .insert([{
                user_name: log.user,
                action: log.action,
                details: log.details,
                category: log.category,
                ip_address: log.ip,
                organization_id: organizationId
            }]);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error adding audit log:', error);
        return { success: false, error: error.message };
    }
}

