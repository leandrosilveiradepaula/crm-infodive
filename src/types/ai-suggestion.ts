import type { ActivityType, ActivityPriority } from './activity';

export interface AiActivitySuggestion {
    id: string;
    organizationId: string;
    dealId: string;
    dealTitle?: string;
    companyName?: string;
    type: ActivityType;
    title: string;
    description?: string;
    priority: ActivityPriority;
    suggestedDueDate?: string;
    reasoning: string;
    status: 'pending' | 'accepted' | 'dismissed';
    acceptedActivityId?: string;
    createdAt: string;
    expiresAt: string;
}
