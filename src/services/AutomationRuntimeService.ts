import { createAdminClient } from '@/lib/supabase/admin';
import { ActivityService } from '@/services/ActivityService';
import { AutomationService } from '@/services/AutomationService';
import { planAutomation, type AutomationRuntimeEvent } from '@/services/automationRuntimeCore';
import type { Automation, AutomationExecution } from '@/types/automation';

type RuntimeResult = {
    automationId: string;
    status: AutomationExecution['status'];
    reason: string;
};

function eventKey(event: AutomationRuntimeEvent): string {
    const eventId = String(event.eventId || '').trim();
    if (!eventId) throw new Error('automation event id is required');
    return eventId;
}

function sanitizeError(error: unknown): string {
    if (error instanceof Error && error.message === 'automation execution finalization failed') return error.message;
    return 'automation action failed';
}

export class AutomationRuntimeService {
    static async executeEvent(
        userId: string,
        organizationId: string,
        event: AutomationRuntimeEvent,
    ): Promise<RuntimeResult[]> {
        if (event.organizationId !== organizationId) {
            throw new Error('automation runtime tenant mismatch');
        }

        const automations = await AutomationService.getAutomations(userId, organizationId);
        const active = automations.filter((automation) => automation.enabled && automation.trigger.type === event.type);
        const results: RuntimeResult[] = [];

        for (const automation of active) {
            results.push(await this.executeAutomation(userId, organizationId, automation, event));
        }

        return results;
    }

    private static async finalizeExecution(
        executionId: string,
        organizationId: string,
        status: 'success' | 'failed',
        error: string | null,
    ): Promise<void> {
        const supabase = createAdminClient();
        const { data, error: persistenceError } = await supabase
            .from('automation_executions')
            .update({ status, completed_at: new Date().toISOString(), error })
            .eq('id', executionId)
            .eq('organization_id', organizationId)
            .select('id')
            .maybeSingle();

        if (persistenceError || !data) {
            throw new Error('automation execution finalization failed');
        }
    }

    private static async executeAutomation(
        userId: string,
        organizationId: string,
        automation: Automation,
        event: AutomationRuntimeEvent,
    ): Promise<RuntimeResult> {
        const plan = planAutomation(automation, event);
        const key = eventKey(event);
        const supabase = createAdminClient();

        const { data: claimed, error: claimError } = await supabase
            .from('automation_executions')
            .insert({
                organization_id: organizationId,
                automation_id: automation.id,
                event_key: key,
                event_type: event.type,
                entity_id: event.entityId,
                status: plan.matched ? 'running' : 'skipped',
                trigger: { type: event.type, data: event.data },
                actions: plan.actions.map((action) => action.type),
                completed_at: plan.matched ? null : new Date().toISOString(),
            })
            .select('id')
            .maybeSingle();

        if (claimError) {
            const code = String((claimError as { code?: string }).code || '');
            if (code === '23505') {
                return { automationId: automation.id, status: 'skipped', reason: 'duplicate_event' };
            }
            throw new Error('automation execution claim failed');
        }

        const executionId = String(claimed?.id || '');
        if (!executionId) throw new Error('automation execution id missing');

        if (!plan.matched) {
            await this.incrementCounters(automation.id, organizationId, 'skipped');
            return { automationId: automation.id, status: 'skipped', reason: plan.reason };
        }

        try {
            for (const action of plan.actions) {
                if (action.type !== 'create_task') throw new Error('unsupported runtime action');

                const title = String(action.config.title || automation.name || 'Tarefa automática').trim();
                if (!title) throw new Error('automation task title is required');

                await ActivityService.createActivity(userId, organizationId, {
                    type: 'task',
                    title,
                    description: action.config.description ? String(action.config.description) : automation.description,
                    status: 'pending',
                    priority: 'medium',
                    dealId: event.entityId,
                    assignedTo: userId,
                    source: 'automation',
                });
            }

            await this.finalizeExecution(executionId, organizationId, 'success', null);
        } catch (error) {
            const message = sanitizeError(error);
            // If the success finalization failed after actions ran, do not
            // overwrite that indeterminate execution with a false failure.
            if (message === 'automation execution finalization failed') throw error;
            await this.finalizeExecution(executionId, organizationId, 'failed', message);
            await this.incrementCounters(automation.id, organizationId, 'failed').catch(() => {
                console.error('[AutomationRuntime] failure counters could not be updated');
            });
            return { automationId: automation.id, status: 'failed', reason: message };
        }

        await this.incrementCounters(automation.id, organizationId, 'success').catch(() => {
            console.error('[AutomationRuntime] success counters could not be updated');
        });
        return { automationId: automation.id, status: 'success', reason: 'executed' };
    }

    private static async incrementCounters(
        automationId: string,
        organizationId: string,
        status: 'success' | 'failed' | 'skipped',
    ) {
        const supabase = createAdminClient();
        const { data } = await supabase
            .from('automations')
            .select('execution_count, success_count, failure_count')
            .eq('id', automationId)
            .eq('organization_id', organizationId)
            .single();

        const executionCount = Number(data?.execution_count || 0) + (status === 'skipped' ? 0 : 1);
        const successCount = Number(data?.success_count || 0) + (status === 'success' ? 1 : 0);
        const failureCount = Number(data?.failure_count || 0) + (status === 'failed' ? 1 : 0);

        await supabase
            .from('automations')
            .update({
                execution_count: executionCount,
                success_count: successCount,
                failure_count: failureCount,
                last_run: status === 'skipped' ? undefined : new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', automationId)
            .eq('organization_id', organizationId);
    }
}
