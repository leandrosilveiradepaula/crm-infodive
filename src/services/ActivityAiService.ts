import { createAdminClient } from '../lib/supabase/admin';
import { ActivityService } from './ActivityService';
import type { AiActivitySuggestion } from '../types/ai-suggestion';

interface ActivityRule {
    activityType: 'call' | 'email' | 'meeting' | 'task';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    dueDaysFromNow: number;
}

const STAGE_RULES: Record<string, ActivityRule> = {
    proposal: {
        activityType: 'email',
        title: 'Follow-up da Proposta',
        description: 'Enviar e-mail de follow-up para confirmar recebimento e esclarecer dúvidas sobre a proposta.',
        priority: 'high',
        dueDaysFromNow: 3
    },
    negotiation: {
        activityType: 'meeting',
        title: 'Reunião de Negociação',
        description: 'Agendar reunião com stakeholders para alinhar termos comerciais e fechar condições.',
        priority: 'urgent',
        dueDaysFromNow: 2
    }
};

export class ActivityAiService {

    // ─── Automation Rules ───────────────────────────────────────

    static async onStageChange(
        userId: string,
        organizationId: string,
        dealId: string,
        newStage: string,
        dealTitle: string
    ) {
        const rule = STAGE_RULES[newStage];
        if (!rule) return;
        await this.createAutomatedActivity(userId, organizationId, dealId, dealTitle, rule);
    }

    static async onDealCreated(
        userId: string,
        organizationId: string,
        dealId: string,
        dealTitle: string
    ) {
        await this.createAutomatedActivity(userId, organizationId, dealId, dealTitle, {
            activityType: 'call',
            title: 'Primeiro Contato',
            description: 'Realizar ligação inicial para apresentar a empresa e entender as necessidades do cliente.',
            priority: 'high',
            dueDaysFromNow: 0
        });
    }

    static async evaluateInactiveDeals(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data: deals, error } = await supabase
            .from('deals')
            .select('id, title, stage, updated_at')
            .eq('organization_id', organizationId)
            .not('stage', 'in', '("won","lost")');

        if (error || !Array.isArray(deals)) throw new Error('Não foi possível avaliar as oportunidades inativas.');

        const now = new Date();

        for (const deal of deals) {
            const { data: existingAuto, error: existingError } = await supabase
                .from('activities')
                .select('id')
                .eq('deal_id', deal.id)
                .eq('source', 'automation')
                .eq('status', 'pending')
                .eq('organization_id', organizationId)
                .limit(1);

            if (existingError || !Array.isArray(existingAuto)) throw new Error('Não foi possível verificar as atividades existentes.');
            if (existingAuto.length > 0) continue;

            const { data: lastActivity, error: lastError } = await supabase
                .from('activities')
                .select('created_at')
                .eq('deal_id', deal.id)
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false })
                .limit(1);
            if (lastError || !Array.isArray(lastActivity)) throw new Error('Não foi possível verificar a última atividade.');

            const lastDate = lastActivity?.[0]?.created_at
                ? new Date(lastActivity[0].created_at)
                : new Date(deal.updated_at);

            const daysSince = Math.floor(
                (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysSince >= 14) {
                await this.createAutomatedActivity(userId, organizationId, deal.id, deal.title, {
                    activityType: 'meeting',
                    title: 'Revisão Estratégica do Deal',
                    description: 'Oportunidade estagnada há 14+ dias. Agendar revisão interna para decidir próxima ação.',
                    priority: 'urgent',
                    dueDaysFromNow: 1
                });
            } else if (daysSince >= 7) {
                await this.createAutomatedActivity(userId, organizationId, deal.id, deal.title, {
                    activityType: 'call',
                    title: 'Reengajar Cliente',
                    description: 'Deal sem interação há 7+ dias. Ligar para verificar interesse e próximos passos.',
                    priority: 'urgent',
                    dueDaysFromNow: 0
                });
            }
        }
    }

    private static async createAutomatedActivity(
        userId: string,
        organizationId: string,
        dealId: string,
        dealTitle: string,
        rule: ActivityRule
    ) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + rule.dueDaysFromNow);

        await ActivityService.createActivity(userId, organizationId, {
            title: `[Auto] ${rule.title} — ${dealTitle}`,
            description: rule.description,
            type: rule.activityType,
            priority: rule.priority,
            status: 'pending',
            dealId,
            dueDate: dueDate.toISOString().split('T')[0],
            assignedTo: userId,
            source: 'automation'
        });
    }

    // ─── AI Suggestions (CRUD) ──────────────────────────────────

    static async getSuggestions(organizationId: string, dealId?: string): Promise<AiActivitySuggestion[]> {
        const supabase = createAdminClient();

        let query = supabase
            .from('ai_activity_suggestions')
            .select('*, deals(title, company)')
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .order('priority', { ascending: true })
            .order('created_at', { ascending: false });

        if (dealId) {
            query = query.eq('deal_id', dealId);
        }

        const { data, error } = await query.limit(50);

        if (error || !Array.isArray(data)) {
            console.error('[ActivityAiService] suggestions fetch failed');
            throw new Error('Não foi possível carregar as sugestões.');
        }

        return data.map((item: any) => ({
            id: item.id,
            organizationId: item.organization_id,
            dealId: item.deal_id,
            dealTitle: item.deals?.title,
            companyName: item.deals?.company,
            type: item.type,
            title: item.title,
            description: item.description,
            priority: item.priority,
            suggestedDueDate: item.suggested_due_date,
            reasoning: item.reasoning,
            status: item.status,
            acceptedActivityId: item.accepted_activity_id,
            createdAt: item.created_at,
            expiresAt: item.expires_at
        }));
    }

    static async acceptSuggestion(
        userId: string,
        organizationId: string,
        suggestionId: string
    ) {
        const supabase = createAdminClient();

        const { data: suggestion, error: fetchError } = await supabase
            .from('ai_activity_suggestions')
            .select('*')
            .eq('id', suggestionId)
            .eq('organization_id', organizationId)
            .single();

        if (fetchError || !suggestion) {
            throw new Error('Sugestão não encontrada');
        }

        const activity = await ActivityService.createActivity(userId, organizationId, {
            title: suggestion.title,
            description: suggestion.description,
            type: suggestion.type,
            priority: suggestion.priority,
            status: 'pending',
            dealId: suggestion.deal_id,
            dueDate: suggestion.suggested_due_date,
            assignedTo: userId,
            source: 'ai_suggestion'
        });

        await supabase
            .from('ai_activity_suggestions')
            .update({
                status: 'accepted',
                accepted_activity_id: activity.id
            })
            .eq('id', suggestionId);

        return activity;
    }

    static async dismissSuggestion(organizationId: string, suggestionId: string) {
        const supabase = createAdminClient();

        const { data: dismissed, error } = await supabase
            .from('ai_activity_suggestions')
            .update({ status: 'dismissed' })
            .eq('id', suggestionId)
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .select('id')
            .maybeSingle();

        if (error || !dismissed) throw new Error('Não foi possível processar a atividade com IA.');
    }

    static async hasValidCache(organizationId: string): Promise<boolean> {
        const supabase = createAdminClient();

        const { count } = await supabase
            .from('ai_activity_suggestions')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', organizationId)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());

        return (count || 0) > 0;
    }

    static async clearExpired(organizationId: string) {
        const supabase = createAdminClient();

        await supabase
            .from('ai_activity_suggestions')
            .delete()
            .eq('organization_id', organizationId)
            .lt('expires_at', new Date().toISOString());
    }
}
