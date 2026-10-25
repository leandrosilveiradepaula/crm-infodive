export interface ServiceDeskSession {
    isLoggedIn: boolean;
    userId: string | null | undefined;
    organizationId: string | null | undefined;
}

export type ServiceDeskEntryDecision =
    | { admitted: true }
    | {
        admitted: false;
        reason: 'unauthenticated' | 'missing-user-id' | 'missing-organization-id';
    };

function hasValue(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Decides access from the already trusted CRM session only.
 */
export function decideServiceDeskEntry(session: ServiceDeskSession): ServiceDeskEntryDecision {
    if (!session.isLoggedIn) {
        return { admitted: false, reason: 'unauthenticated' };
    }

    if (!hasValue(session.userId)) {
        return { admitted: false, reason: 'missing-user-id' };
    }

    if (!hasValue(session.organizationId)) {
        return { admitted: false, reason: 'missing-organization-id' };
    }

    return { admitted: true };
}
