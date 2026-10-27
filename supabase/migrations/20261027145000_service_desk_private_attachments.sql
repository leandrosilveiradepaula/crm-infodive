-- CRM #200 / Service Desk #12: private ticket attachments in the CRM's
-- existing "documents" Storage bucket. Never create a second Supabase.
-- Additive candidate only; DO NOT apply to CRM production without approval.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

DO $baseline$
BEGIN
  IF to_regclass('service_desk.ticket_attachments') IS NULL OR
     to_regclass('service_desk.tickets') IS NULL OR
     to_regprocedure('service_desk.require_actor(uuid,uuid,boolean)') IS NULL
  THEN RAISE EXCEPTION 'Service Desk module baseline missing'; END IF;
  IF EXISTS (SELECT 1 FROM service_desk.ticket_attachments)
  THEN RAISE EXCEPTION 'Existing attachments require an explicit backfill'; END IF;
END;
$baseline$;

ALTER TABLE service_desk.ticket_attachments
  ADD COLUMN uploaded_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ADD COLUMN mime_type text NOT NULL,
  ADD COLUMN file_size bigint NOT NULL,
  ADD CONSTRAINT service_desk_attachment_size_chk CHECK (file_size BETWEEN 1 AND 5242880),
  ADD CONSTRAINT service_desk_attachment_mime_chk CHECK (
    mime_type IN ('application/pdf','image/png','image/jpeg','text/plain')
  );

CREATE INDEX service_desk_attachments_ticket_idx
  ON service_desk.ticket_attachments(organization_id,ticket_id,created_at DESC);

-- The CRM private bucket exists already. The path and actor must match the
-- ticket's actual CRM organization; never accept a client-selected tenant.
CREATE FUNCTION service_desk.validate_ticket_attachment()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $guard$
BEGIN
  IF TG_OP='UPDATE' THEN
    RAISE EXCEPTION 'Attachment history is immutable' USING errcode='42501';
  END IF;
  IF NOT EXISTS (
     SELECT 1 FROM service_desk.tickets t
       WHERE t.id=NEW.ticket_id AND t.organization_id=NEW.organization_id
    ) OR NOT EXISTS (
     SELECT 1 FROM public.profiles p WHERE p.id=NEW.uploaded_by_user_id
       AND p.organization_id=NEW.organization_id AND p.status='active'
    ) THEN
    RAISE EXCEPTION 'Attachment actor or ticket outside CRM organization'
      USING errcode='23514';
  END IF;
  IF split_part(NEW.object_key,'/',1)<>'service-desk'
    OR split_part(NEW.object_key,'/',2)<>NEW.organization_id::text
    OR split_part(NEW.object_key,'/',3)<>NEW.ticket_id::text
    OR split_part(NEW.object_key,'/',5)<>''
    OR split_part(NEW.object_key,'/',4) !~
      '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg|txt)$'
  THEN RAISE EXCEPTION 'Attachment Storage path outside CRM ticket'
    USING errcode='23514'; END IF;
  RETURN NEW;
END;
$guard$;
CREATE TRIGGER service_desk_attachment_scope
  BEFORE INSERT OR UPDATE ON service_desk.ticket_attachments
  FOR EACH ROW EXECUTE FUNCTION service_desk.validate_ticket_attachment();

CREATE FUNCTION public.crm_sd_check_attachment_ticket_v1(
  p_actor uuid,p_organization uuid,p_ticket uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $check$
BEGIN
  PERFORM service_desk.require_actor(p_actor,p_organization,true);
  IF NOT EXISTS (SELECT 1 FROM service_desk.tickets t
     WHERE t.id=p_ticket AND t.organization_id=p_organization)
  THEN RAISE EXCEPTION 'Ticket not accessible for attachment'
    USING errcode='42501'; END IF;
  RETURN true;
END;
$check$;

CREATE FUNCTION public.crm_sd_register_attachment_v1(
  p_actor uuid,p_organization uuid,p_ticket uuid,p_object_key text,
  p_filename text,p_mime text,p_size bigint
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $register$
DECLARE v_id uuid;
BEGIN
  PERFORM public.crm_sd_check_attachment_ticket_v1(p_actor,p_organization,p_ticket);
  IF p_filename IS NULL OR char_length(btrim(p_filename)) NOT BETWEEN 1 AND 255
    OR p_mime IS NULL OR p_mime NOT IN ('application/pdf','image/png','image/jpeg','text/plain')
    OR p_size IS NULL OR p_size NOT BETWEEN 1 AND 5242880
  THEN RAISE EXCEPTION 'Invalid attachment metadata' USING errcode='22023'; END IF;
  INSERT INTO service_desk.ticket_attachments (
    organization_id,ticket_id,uploaded_by_user_id,object_key,
    filename,mime_type,file_size
  ) VALUES (
    p_organization,p_ticket,p_actor,p_object_key,
    btrim(p_filename),p_mime,p_size
  ) RETURNING id INTO v_id;
  INSERT INTO service_desk.ticket_events (
    organization_id,ticket_id,actor_user_id,event_type,detail
  ) VALUES (
    p_organization,p_ticket,p_actor,'attachment_registered',
    jsonb_build_object('attachment_id',v_id)
  );
  RETURN jsonb_build_object('id',v_id,'ticket_id',p_ticket);
END;
$register$;

CREATE FUNCTION public.crm_sd_list_attachments_v1(
  p_actor uuid,p_organization uuid,p_ticket uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $list$
DECLARE v_result jsonb;
BEGIN
  PERFORM public.crm_sd_check_attachment_ticket_v1(p_actor,p_organization,p_ticket);
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'filename',a.filename,'mime_type',a.mime_type,
    'file_size',a.file_size,'created_at',a.created_at
  ) ORDER BY a.created_at DESC,a.id),'[]'::jsonb) INTO v_result
  FROM service_desk.ticket_attachments a
  WHERE a.ticket_id=p_ticket AND a.organization_id=p_organization;
  RETURN v_result;
END;
$list$;

CREATE FUNCTION public.crm_sd_attachment_path_v1(
  p_actor uuid,p_organization uuid,p_attachment uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $path$
DECLARE v_result jsonb;
BEGIN
  PERFORM service_desk.require_actor(p_actor,p_organization,false);
  SELECT jsonb_build_object(
    'object_key',a.object_key,'filename',a.filename,'mime_type',a.mime_type
  ) INTO v_result
  FROM service_desk.ticket_attachments a
  JOIN service_desk.tickets t ON t.id=a.ticket_id AND t.organization_id=a.organization_id
  WHERE a.id=p_attachment AND a.organization_id=p_organization
    AND t.organization_id=p_organization;
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Attachment unavailable' USING errcode='42501';
  END IF;
  RETURN v_result;
END;
$path$;

-- Nothing is ever granted to browser roles; only CRM's existing server key.
REVOKE ALL ON FUNCTION service_desk.validate_ticket_attachment()
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_check_attachment_ticket_v1(uuid,uuid,uuid)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_register_attachment_v1(uuid,uuid,uuid,text,text,text,bigint)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_list_attachments_v1(uuid,uuid,uuid)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_attachment_path_v1(uuid,uuid,uuid)
  FROM PUBLIC,anon,authenticated;

GRANT EXECUTE ON FUNCTION service_desk.validate_ticket_attachment() TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_check_attachment_ticket_v1(uuid,uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_register_attachment_v1(uuid,uuid,uuid,text,text,text,bigint)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_list_attachments_v1(uuid,uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_attachment_path_v1(uuid,uuid,uuid) TO service_role;

COMMIT;
