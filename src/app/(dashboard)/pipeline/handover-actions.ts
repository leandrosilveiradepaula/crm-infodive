'use server';

import { HandoverService } from '@/services/HandoverService';
import { Handover } from '@/hooks/useHandover';
import { requireSessionContext } from '@/lib/auth-server';

export async function getHandover(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await HandoverService.getHandover(userId, dealId, organizationId);
}

export async function createHandover(handover: Partial<Handover>) {
    const { userId, organizationId } = await requireSessionContext();
    return await HandoverService.createHandover(userId, organizationId, handover);
}

export async function updateHandover(id: string, updates: Partial<Handover>) {
    const { userId, organizationId } = await requireSessionContext();
    return await HandoverService.updateHandover(userId, id, organizationId, updates);
}
