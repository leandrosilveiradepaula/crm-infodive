'use server';

import { requireSessionContext } from '../../../lib/auth-server';
import { createAdminClient } from '../../../lib/supabase/admin';

type TicketPriority = 'low' | 'normal' | 'high' | 'urgent';
const validPriorities = new Set(['low','normal','high','urgent']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireServiceDeskActor() {
  const session = await requireSessionContext();
  const admin = createAdminClient();
  const { data: profile, error } = await admin.from('profiles')
    .select('id,role,status,organization_id')
    .eq('id',session.userId).eq('organization_id',session.organizationId).maybeSingle();
  if (error || !profile || profile.status !== 'active' ||
      !['admin','manager','support'].includes(profile.role) ||
      profile.organization_id !== session.organizationId) {
    throw new Error('Forbidden: CRM Service Desk role required');
  }
  return { ...session, admin };
}

export async function listServiceDeskTickets() {
  const { userId, organizationId, admin } = await requireServiceDeskActor();
  const { data, error } = await admin.rpc('crm_sd_list_tickets_v1',
    { p_actor:userId,p_organization:organizationId });
  if (error || !Array.isArray(data)) throw new Error('Service Desk unavailable');
  return data as Array<{id:string;ticket_number:number;subject:string;status:string;
    priority:TicketPriority;account_name:string;contract_title:string|null;
    created_at:string}>;
}

export async function listServiceDeskAccounts() {
  const { organizationId, admin } = await requireServiceDeskActor();
  const { data, error } = await admin.from('accounts').select('id,name')
    .eq('organization_id',organizationId).order('name').limit(100);
  if (error) throw new Error('CRM accounts unavailable');
  return data || [];
}

export async function listServiceDeskContracts(accountId: string) {
  if (!UUID.test(accountId)) throw new Error('Invalid CRM account');
  const { organizationId, admin } = await requireServiceDeskActor();
  const { data, error } = await admin.from('service_contracts')
    .select('id,title').eq('organization_id',organizationId)
    .eq('account_id',accountId).limit(100);
  if (error) throw new Error('CRM service contracts unavailable');
  return data || [];
}

export async function createServiceDeskTicket(input: {
  accountId:string;contractId?:string|null;subject:string;description?:string;priority:TicketPriority;
}) {
  const { userId, organizationId, admin } = await requireServiceDeskActor();
  if (!input || !UUID.test(input.accountId) ||
      (input.contractId != null && !UUID.test(input.contractId)) ||
      typeof input.subject !== 'string' ||
      input.subject.trim().length < 3 || input.subject.trim().length > 240 ||
      (input.description !== undefined &&
       (typeof input.description !== 'string' || input.description.length > 5000)) ||
      !validPriorities.has(input.priority)) throw new Error('Invalid ticket request');
  const { data, error } = await admin.rpc('crm_sd_create_ticket_v1',{
    p_actor:userId,p_organization:organizationId,p_account:input.accountId,
    p_contract:input.contractId || null,p_subject:input.subject.trim(),
    p_description:input.description || null,p_priority:input.priority
  });
  if (error || !data?.id) throw new Error('CRM Service Desk ticket creation failed');
  return data as {id:string;ticket_number:number};
}

export async function transitionServiceDeskTicket(input: {
  id:string;expected:string;next:string;
}) {
  if (!input || !UUID.test(input.id) || !/^[a-z][a-z0-9_]{1,31}$/.test(input.expected)
      || !/^[a-z][a-z0-9_]{1,31}$/.test(input.next))
    throw new Error('Invalid ticket transition request');
  const { userId, organizationId, admin } = await requireServiceDeskActor();
  const { data, error } = await admin.rpc('crm_sd_transition_ticket_v1',{
    p_actor:userId,p_organization:organizationId,p_ticket:input.id,
    p_expected:input.expected,p_next:input.next
  });
  if (error || data?.id !== input.id) throw new Error('CRM Service Desk transition failed');
  return data as {id:string;status:string};
}
