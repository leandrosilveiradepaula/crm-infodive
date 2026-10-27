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

export async function addServiceDeskComment(input: {
  ticketId:string;body:string;visibility:'public'|'internal';
}) {
  if (!input || !UUID.test(input.ticketId) || typeof input.body !== 'string' ||
      input.body.trim().length < 1 || input.body.trim().length > 5000 ||
      !['public','internal'].includes(input.visibility))
    throw new Error('Invalid ticket comment');
  const { userId,organizationId,admin } = await requireServiceDeskActor();
  const { data,error } = await admin.rpc('crm_sd_add_comment_v1',{
    p_actor:userId,p_organization:organizationId,p_ticket:input.ticketId,
    p_body:input.body.trim(),p_visibility:input.visibility
  });
  if (error || !data?.id) throw new Error('Comment rejected');
  return data as {id:string;ticket_id:string};
}

export async function recordServiceDeskTime(input: {
  ticketId:string;minutes:number;description:string;
}) {
  if (!input || !UUID.test(input.ticketId) || !Number.isInteger(input.minutes) ||
      input.minutes<1 || input.minutes>1440 ||
      typeof input.description !== 'string' ||
      input.description.trim().length < 1 || input.description.trim().length>5000)
    throw new Error('Invalid work time');
  const { userId,organizationId,admin } = await requireServiceDeskActor();
  const { data,error } = await admin.rpc('crm_sd_record_time_v1',{
    p_actor:userId,p_organization:organizationId,p_ticket:input.ticketId,
    p_minutes:input.minutes,p_description:input.description.trim()
  });
  if (error || !data?.id) throw new Error('Work time rejected');
  return data as {id:string;ticket_id:string;minutes:number};
}

export type KnowledgeStatus = 'draft'|'in_review'|'published'|'archived';
export type KnowledgeVisibility = 'tenant'|'private'|'public';
const knowledgeStates = new Set(['draft','in_review','published','archived']);
const knowledgeVisibilities = new Set(['tenant','private','public']);

export async function listServiceDeskKnowledge() {
  const { userId,organizationId,admin } = await requireServiceDeskActor();
  const { data,error } = await admin.rpc('crm_sd_list_knowledge_v1',{
    p_actor:userId,p_organization:organizationId
  });
  if(error||!Array.isArray(data)) throw new Error('Knowledge unavailable');
  return data as Array<{id:string;title:string;content:string;revision:number;
    status:KnowledgeStatus;visibility:KnowledgeVisibility;author_user_id:string;updated_at:string}>;
}

export async function createServiceDeskKnowledge(input: {
  accountId?:string|null;title:string;content:string;visibility:KnowledgeVisibility;
}) {
  if(!input || (input.accountId!=null&&!UUID.test(input.accountId)) ||
     typeof input.title!=='string'||input.title.trim().length<3||input.title.trim().length>240 ||
     typeof input.content!=='string'||input.content.trim().length<1||input.content.trim().length>100000 ||
     !knowledgeVisibilities.has(input.visibility)) throw new Error('Invalid knowledge content');
  const { userId,organizationId,admin } = await requireServiceDeskActor();
  const { data,error } = await admin.rpc('crm_sd_create_knowledge_v1',{
    p_actor:userId,p_organization:organizationId,p_account:input.accountId||null,
    p_title:input.title.trim(),p_content:input.content.trim(),p_visibility:input.visibility
  });
  if(error||!data?.id) throw new Error('Knowledge creation denied');
  return data as {id:string;revision:number;status:KnowledgeStatus};
}

export async function updateServiceDeskKnowledge(input: {
 id:string;expectedRevision:number;title:string;content:string;visibility:KnowledgeVisibility;
}) {
  if(!input||!UUID.test(input.id)||!Number.isInteger(input.expectedRevision)||
     input.expectedRevision<1||typeof input.title!=='string'||
     input.title.trim().length<3||input.title.trim().length>240||
     typeof input.content!=='string'||input.content.trim().length<1||
     input.content.trim().length>100000||!knowledgeVisibilities.has(input.visibility))
    throw new Error('Invalid knowledge revision');
  const {userId,organizationId,admin}=await requireServiceDeskActor();
  const {data,error}=await admin.rpc('crm_sd_update_knowledge_v1',{
    p_actor:userId,p_organization:organizationId,p_article:input.id,
    p_expected:input.expectedRevision,p_title:input.title.trim(),
    p_content:input.content.trim(),p_visibility:input.visibility
  });
  if(error||data?.id!==input.id)throw new Error('Knowledge edit denied');
  return data as {id:string;revision:number;status:KnowledgeStatus};
}

export async function transitionServiceDeskKnowledge(input: {
  id:string;expectedRevision:number;next:KnowledgeStatus;
}) {
  if(!input||!UUID.test(input.id)||!Number.isInteger(input.expectedRevision)||
    input.expectedRevision<1||!knowledgeStates.has(input.next))
    throw new Error('Invalid knowledge transition');
  const {userId,organizationId,admin}=await requireServiceDeskActor();
  const {data,error}=await admin.rpc('crm_sd_transition_knowledge_v1',{
    p_actor:userId,p_organization:organizationId,p_article:input.id,
    p_expected:input.expectedRevision,p_next:input.next
  });
  if(error||data?.id!==input.id)throw new Error('Knowledge transition denied');
  return data as {id:string;revision:number;status:KnowledgeStatus};
}

export async function linkServiceDeskKnowledge(input: {ticketId:string;articleId:string}) {
  if(!input||!UUID.test(input.ticketId)||!UUID.test(input.articleId))
    throw new Error('Invalid ticket-knowledge relationship');
  const {userId,organizationId,admin}=await requireServiceDeskActor();
  const {data,error}=await admin.rpc('crm_sd_link_knowledge_v1',{
    p_actor:userId,p_organization:organizationId,p_ticket:input.ticketId,
    p_article:input.articleId
  });
  if(error||data?.article_id!==input.articleId) throw new Error('Knowledge link denied');
  return data as {ticket_id:string;article_id:string};
}

const attachmentTypes:Record<string,string>={
  'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg','text/plain':'txt'
};
export async function listServiceDeskAttachments(ticketId:string){
  if(!UUID.test(ticketId))throw new Error('Invalid ticket');
  const {userId,organizationId,admin}=await requireServiceDeskActor();
  const {data,error}=await admin.rpc('crm_sd_list_attachments_v1',{
    p_actor:userId,p_organization:organizationId,p_ticket:ticketId
  });
  if(error||!Array.isArray(data))throw new Error('Attachments unavailable');
  return data as Array<{id:string;filename:string;mime_type:string;file_size:number;created_at:string}>;
}

type AttachmentRequest={ticketId:string;filename:string;mimeType:string;size:number};
const allowedAttachmentSize=5*1024*1024;
function validateAttachmentRequest(input:AttachmentRequest){
  if(!input||!UUID.test(input.ticketId)||
    typeof input.filename!=='string'||input.filename.trim().length<1||
    input.filename.length>255||
    !Number.isInteger(input.size)||input.size<1||input.size>allowedAttachmentSize||
    typeof input.mimeType!=='string'||!Object.hasOwn(attachmentTypes,input.mimeType))
    throw new Error('Invalid attachment');
}

/** Issues a path-scoped token only after CRM profile and ticket authorization.
 * File bytes go directly browser -> private CRM Supabase Storage, avoiding the
 * Next.js Server Action 1 MB and Vercel Function 4.5 MB request limits.
 */
export async function requestServiceDeskAttachmentUpload(input:AttachmentRequest){
  validateAttachmentRequest(input);
  const {userId,organizationId,admin}=await requireServiceDeskActor();
  const {data:allowed,error:permissionError}=await admin.rpc(
    'crm_sd_check_attachment_ticket_v1',{
      p_actor:userId,p_organization:organizationId,p_ticket:input.ticketId
    });
  if(permissionError||allowed!==true)throw new Error('Attachment forbidden');
  const path='service-desk/'+organizationId+'/'+input.ticketId+'/'+
    crypto.randomUUID()+'.'+attachmentTypes[input.mimeType];
  const {data,error}=await admin.storage.from('documents').createSignedUploadUrl(
    path,{upsert:false}
  );
  if(error||!data?.token)throw new Error('Private upload authorization unavailable');
  return {path,token:data.token};
}

/** Final registration requires a fresh CRM session, original ticket scope,
 * and independently inspected Storage bytes before the database is updated.
 */
export async function completeServiceDeskAttachmentUpload(
  input:AttachmentRequest & {path:string}
){
  validateAttachmentRequest(input);
  const {userId,organizationId,admin}=await requireServiceDeskActor();
  const prefix='service-desk/'+organizationId+'/'+input.ticketId+'/';
  const suffix=attachmentTypes[input.mimeType];
  const filename=typeof input.path==='string'&&input.path.startsWith(prefix)
    ?input.path.slice(prefix.length):'';
  if(!new RegExp(
     '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.'+suffix+'$'
    ).test(filename))throw new Error('Invalid attachment path');
  const {data:allowed,error:permissionError}=await admin.rpc(
    'crm_sd_check_attachment_ticket_v1',{
      p_actor:userId,p_organization:organizationId,p_ticket:input.ticketId
    });
  if(permissionError||allowed!==true)throw new Error('Attachment forbidden');
  const {data:info,error:infoError}=await admin.storage.from('documents').info(input.path);
  if(infoError||!info||info.size!==input.size||info.size>allowedAttachmentSize||
     info.contentType!==input.mimeType)
    throw new Error('Uploaded attachment metadata mismatch');
  const {data,error}=await admin.rpc('crm_sd_register_attachment_v1',{
    p_actor:userId,p_organization:organizationId,p_ticket:input.ticketId,
    p_object_key:input.path,p_filename:input.filename,
    p_mime:input.mimeType,p_size:input.size
  });
  // Do NOT delete on DB failure: an idempotent retry must never destroy a
  // previously registered file. Orphan reconciliation is a separate concern.
  if(error||!data?.id)throw new Error('Attachment registration failed');
  return data as {id:string;ticket_id:string};
}

export async function getServiceDeskAttachmentUrl(attachmentId:string){
  if(!UUID.test(attachmentId))throw new Error('Invalid attachment ID');
  const {userId,organizationId,admin}=await requireServiceDeskActor();
  const {data,error}=await admin.rpc('crm_sd_attachment_path_v1',{
    p_actor:userId,p_organization:organizationId,p_attachment:attachmentId
  });
  if(error||typeof data?.object_key!=='string'||
    !data.object_key.startsWith('service-desk/'+organizationId+'/'))
    throw new Error('Attachment forbidden');
  const {data:signed,error:signError}=await admin.storage.from('documents')
    .createSignedUrl(data.object_key,60);
  if(signError||!signed?.signedUrl)throw new Error('Private download failed');
  return signed.signedUrl as string;
}
