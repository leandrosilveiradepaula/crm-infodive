-- CRM #200 / Service Desk #12: additive module in CRM's AUTHORITATIVE database.
-- CANDIDATE ONLY. Do not apply to production before a separately approved migration.
-- Never replay the standalone Service Desk migrations against CRM public.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

DO $baseline$
BEGIN
  IF to_regclass('public.profiles') IS NULL OR to_regclass('public.accounts') IS NULL
     OR to_regclass('public.service_contracts') IS NULL
     OR to_regprocedure('crm_internal.current_organization_id()') IS NULL
     OR to_regnamespace('service_desk') IS NOT NULL
  THEN RAISE EXCEPTION 'CRM Service Desk baseline mismatch or module already installed';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='service_contracts'
      AND column_name='organization_id' AND udt_name='uuid'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='accounts'
      AND column_name='organization_id' AND udt_name='uuid'
  ) THEN RAISE EXCEPTION 'CRM organization columns must be authoritative UUIDs'; END IF;
END;
$baseline$;

-- No public Data API exposure of this schema is required. The CRM's existing
-- authenticated Next.js server uses service_role-only public RPCs below.
CREATE SCHEMA service_desk;
REVOKE ALL ON SCHEMA service_desk FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA service_desk TO service_role;

CREATE TABLE service_desk.status_definitions (
  code text PRIMARY KEY CHECK (code ~ '^[a-z][a-z0-9_]{1,31}$'),
  label text NOT NULL CHECK (char_length(btrim(label)) BETWEEN 2 AND 80),
  terminal boolean NOT NULL DEFAULT false
);
CREATE TABLE service_desk.status_transitions (
  from_status text NOT NULL REFERENCES service_desk.status_definitions(code),
  to_status text NOT NULL REFERENCES service_desk.status_definitions(code),
  PRIMARY KEY (from_status,to_status),
  CHECK (from_status <> to_status)
);
-- Canonical module statuses, NOT copies of QA demonstration tenant records.
-- Any additional status mapping from standalone QA must be reviewed separately.
-- Preserve exactly the legacy Service Desk's eight canonical status codes
-- and its transition graph. No synthetic 'triaged' replacement.
INSERT INTO service_desk.status_definitions(code,label,terminal) VALUES
  ('new','Novo',false),
  ('open','Aberto',false),
  ('in_progress','Em andamento',false),
  ('waiting_customer','Aguardando cliente',false),
  ('waiting_third_party','Aguardando terceiro',false),
  ('resolved','Resolvido',false),
  ('closed','Fechado',true),
  ('reopened','Reaberto',false);
INSERT INTO service_desk.status_transitions(from_status,to_status) VALUES
  ('new','open'),
  ('new','in_progress'),
  ('new','waiting_customer'),
  ('new','waiting_third_party'),
  ('new','resolved'),
  ('new','closed'),
  ('open','in_progress'),
  ('open','waiting_customer'),
  ('open','waiting_third_party'),
  ('open','resolved'),
  ('open','closed'),
  ('in_progress','open'),
  ('in_progress','waiting_customer'),
  ('in_progress','waiting_third_party'),
  ('in_progress','resolved'),
  ('in_progress','closed'),
  ('waiting_customer','open'),
  ('waiting_customer','in_progress'),
  ('waiting_customer','waiting_third_party'),
  ('waiting_customer','resolved'),
  ('waiting_customer','closed'),
  ('waiting_third_party','open'),
  ('waiting_third_party','in_progress'),
  ('waiting_third_party','waiting_customer'),
  ('waiting_third_party','resolved'),
  ('waiting_third_party','closed'),
  ('resolved','open'),
  ('resolved','in_progress'),
  ('resolved','closed'),
  ('resolved','reopened'),
  ('closed','reopened'),
  ('reopened','open'),
  ('reopened','in_progress'),
  ('reopened','waiting_customer'),
  ('reopened','waiting_third_party'),
  ('reopened','resolved'),
  ('reopened','closed');

CREATE TABLE service_desk.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number bigint GENERATED ALWAYS AS IDENTITY UNIQUE,
  organization_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  service_contract_id uuid REFERENCES public.service_contracts(id) ON DELETE RESTRICT,
  requester_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assignee_user_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  subject text NOT NULL CHECK (char_length(btrim(subject)) BETWEEN 3 AND 240),
  description text CHECK (description IS NULL OR char_length(description) <= 5000),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status text NOT NULL DEFAULT 'new' REFERENCES service_desk.status_definitions(code),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,id)
);
CREATE INDEX service_desk_tickets_org_created ON service_desk.tickets(organization_id,created_at DESC);
CREATE INDEX service_desk_tickets_org_account ON service_desk.tickets(organization_id,account_id,created_at DESC);
CREATE INDEX service_desk_tickets_org_contract ON service_desk.tickets(organization_id,service_contract_id)
 WHERE service_contract_id IS NOT NULL;

-- Validate real CRM client/contract/profile linkage for *every* privileged
-- write. A service_role bypasses RLS, so it must not bypass these constraints.
CREATE FUNCTION service_desk.assert_ticket_scope()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $scope$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id
     OR NEW.organization_id IS DISTINCT FROM OLD.organization_id
     OR NEW.ticket_number IS DISTINCT FROM OLD.ticket_number
     OR NEW.requester_user_id IS DISTINCT FROM OLD.requester_user_id)
  THEN RAISE EXCEPTION 'Immutable ticket identity and organization' USING errcode='23514'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.accounts a
     WHERE a.id=NEW.account_id AND a.organization_id=NEW.organization_id)
  THEN RAISE EXCEPTION 'Account does not belong to authorized CRM organization' USING errcode='23514'; END IF;
  IF NEW.service_contract_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.service_contracts sc
    WHERE sc.id=NEW.service_contract_id AND sc.account_id=NEW.account_id
      AND sc.organization_id=NEW.organization_id
  ) THEN RAISE EXCEPTION 'CRM contract/account organization mismatch' USING errcode='23514'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles p
    WHERE p.id=NEW.requester_user_id AND p.organization_id=NEW.organization_id
      AND p.status='active')
  THEN RAISE EXCEPTION 'Requester is not an active CRM member' USING errcode='23514'; END IF;
  IF NEW.assignee_user_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id=NEW.assignee_user_id
      AND p.organization_id=NEW.organization_id AND p.status='active'
  ) THEN RAISE EXCEPTION 'Assignee must be an active CRM member' USING errcode='23514'; END IF;
  IF TG_OP='UPDATE' AND NEW.status IS DISTINCT FROM OLD.status AND NOT EXISTS (
    SELECT 1 FROM service_desk.status_transitions t
    WHERE t.from_status=OLD.status AND t.to_status=NEW.status
  ) THEN RAISE EXCEPTION 'Ticket transition is not allowed' USING errcode='23514'; END IF;
  NEW.updated_at:=now();
  RETURN NEW;
END;
$scope$;
CREATE TRIGGER service_desk_assert_ticket_scope BEFORE INSERT OR UPDATE
ON service_desk.tickets FOR EACH ROW EXECUTE FUNCTION service_desk.assert_ticket_scope();

CREATE TABLE service_desk.ticket_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  author_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 5000),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','internal')),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,ticket_id)
    REFERENCES service_desk.tickets(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX service_desk_comments_ticket_created ON service_desk.ticket_comments(ticket_id,created_at);
CREATE TABLE service_desk.ticket_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  actor_user_id uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (char_length(btrim(event_type)) BETWEEN 2 AND 80),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(detail)='object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,ticket_id)
    REFERENCES service_desk.tickets(organization_id,id) ON DELETE CASCADE
);
CREATE INDEX service_desk_events_ticket_time ON service_desk.ticket_events(ticket_id,occurred_at);

-- Extensions reference CRM service contracts, never recreate that entity.
CREATE TABLE service_desk.sla_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES public.service_contracts(id) ON DELETE RESTRICT,
  version integer NOT NULL CHECK (version > 0),
  priority text NOT NULL CHECK (priority IN ('low','normal','high','urgent')),
  first_response_minutes integer NOT NULL CHECK (first_response_minutes >= 0),
  resolution_minutes integer NOT NULL CHECK (resolution_minutes >= 0),
  valid_from timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contract_id,version,priority)
);
CREATE TABLE service_desk.knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  account_id uuid REFERENCES public.accounts(id) ON DELETE RESTRICT,
  author_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 3 AND 240),
  content text NOT NULL,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE service_desk.time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  author_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  minutes integer NOT NULL CHECK (minutes > 0),
  description text NOT NULL CHECK (char_length(btrim(description)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,ticket_id)
    REFERENCES service_desk.tickets(organization_id,id) ON DELETE RESTRICT
);
CREATE TABLE service_desk.ticket_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  object_key text NOT NULL CHECK (char_length(btrim(object_key)) BETWEEN 3 AND 500),
  filename text NOT NULL CHECK (char_length(btrim(filename)) BETWEEN 1 AND 255),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,ticket_id)
    REFERENCES service_desk.tickets(organization_id,id) ON DELETE CASCADE,
  UNIQUE (organization_id,object_key)
);
-- No attachment upload/download endpoint is enabled by this migration.
-- Existing CRM Storage policies remain unchanged; private bucket required.

-- Even if Data API schemas are misconfigured later, anonymous users do not
-- acquire table privileges. RLS is enabled as defense in depth.
DO $rls$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'status_definitions','status_transitions','tickets','ticket_comments',
    'ticket_events','sla_rule_versions','knowledge_articles','time_entries','ticket_attachments'
  ] LOOP
    EXECUTE format('ALTER TABLE service_desk.%I ENABLE ROW LEVEL SECURITY',t);
  END LOOP;
END;
$rls$;
CREATE POLICY service_desk_tickets_crm_tenant ON service_desk.tickets
  FOR ALL TO authenticated
  USING (organization_id=(SELECT crm_internal.current_organization_id())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid())
      AND p.organization_id=organization_id AND p.status='active'
      AND p.role IN ('admin','manager','support')))
  WITH CHECK (organization_id=(SELECT crm_internal.current_organization_id())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid())
      AND p.organization_id=organization_id AND p.status='active'
      AND p.role IN ('admin','manager','support')));
-- Other module tables have no direct authenticated policies: only reviewed
-- server-side RPCs may expose their records.
REVOKE ALL ON ALL TABLES IN SCHEMA service_desk FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA service_desk TO service_role;
GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA service_desk TO service_role;

-- RPCs execute with the CRM's already-configured service_role key, but they
-- still independently recheck actor+tenant against active CRM profiles.
CREATE FUNCTION service_desk.require_actor(p_actor uuid,p_organization uuid,p_manage boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $actor$
BEGIN
  IF current_user <> 'service_role' OR p_actor IS NULL OR p_organization IS NULL
    OR NOT EXISTS (SELECT 1 FROM public.profiles p
      WHERE p.id=p_actor AND p.organization_id=p_organization AND p.status='active'
        AND p.role IN ('admin','manager','support'))
  THEN RAISE EXCEPTION 'CRM Service Desk actor not authorized' USING errcode='42501'; END IF;
END;
$actor$;

CREATE FUNCTION public.crm_sd_list_tickets_v1(p_actor uuid,p_organization uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $list$
DECLARE v_rows jsonb;
BEGIN
  PERFORM service_desk.require_actor(p_actor,p_organization,false);
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id',t.id,'ticket_number',t.ticket_number,'organization_id',t.organization_id,
    'account_id',t.account_id,'account_name',a.name,
    'service_contract_id',t.service_contract_id,'contract_title',c.title,
    'subject',t.subject,'description',t.description,'priority',t.priority,
    'status',t.status,'created_at',t.created_at,'updated_at',t.updated_at
  ) ORDER BY t.created_at DESC,t.id DESC),'[]'::jsonb)
  INTO v_rows FROM (
    SELECT * FROM service_desk.tickets
    WHERE organization_id=p_organization
    ORDER BY created_at DESC,id DESC LIMIT 50
  ) t JOIN public.accounts a ON a.id=t.account_id AND a.organization_id=p_organization
  LEFT JOIN public.service_contracts c ON c.id=t.service_contract_id
     AND c.account_id=t.account_id AND c.organization_id=p_organization;
  RETURN v_rows;
END;
$list$;

CREATE FUNCTION public.crm_sd_create_ticket_v1(
  p_actor uuid,p_organization uuid,p_account uuid,p_contract uuid,
  p_subject text,p_description text,p_priority text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $create$
DECLARE v_ticket service_desk.tickets%ROWTYPE;
BEGIN
  PERFORM service_desk.require_actor(p_actor,p_organization,true);
  IF p_subject IS NULL OR char_length(btrim(p_subject)) NOT BETWEEN 3 AND 240
    OR (p_description IS NOT NULL AND char_length(p_description)>5000)
    OR p_priority NOT IN ('low','normal','high','urgent') OR p_priority IS NULL
  THEN RAISE EXCEPTION 'Invalid ticket request' USING errcode='22023'; END IF;
  INSERT INTO service_desk.tickets(
    organization_id,account_id,service_contract_id,requester_user_id,
    subject,description,priority)
  VALUES(p_organization,p_account,p_contract,p_actor,
    btrim(p_subject),nullif(btrim(p_description),''),p_priority)
  RETURNING * INTO v_ticket;
  INSERT INTO service_desk.ticket_events(
    organization_id,ticket_id,actor_user_id,event_type)
  VALUES(p_organization,v_ticket.id,p_actor,'created');
  RETURN jsonb_build_object('id',v_ticket.id,'ticket_number',v_ticket.ticket_number);
END;
$create$;

CREATE FUNCTION public.crm_sd_transition_ticket_v1(
  p_actor uuid,p_organization uuid,p_ticket uuid,p_expected text,p_next text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $transition$
DECLARE v_current service_desk.tickets%ROWTYPE;
BEGIN
  PERFORM service_desk.require_actor(p_actor,p_organization,true);
  SELECT * INTO v_current FROM service_desk.tickets t
    WHERE t.id=p_ticket AND t.organization_id=p_organization FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ticket not found in CRM organization' USING errcode='P0002'; END IF;
  IF v_current.status IS DISTINCT FROM p_expected THEN
    RAISE EXCEPTION 'Ticket changed concurrently' USING errcode='40001'; END IF;
  UPDATE service_desk.tickets SET status=p_next WHERE id=p_ticket AND organization_id=p_organization;
  INSERT INTO service_desk.ticket_events(
    organization_id,ticket_id,actor_user_id,event_type,detail)
  VALUES(p_organization,p_ticket,p_actor,'status_changed',
    jsonb_build_object('from',p_expected,'to',p_next));
  RETURN jsonb_build_object('id',p_ticket,'status',p_next);
END;
$transition$;

-- PostgREST exposes public RPCs only to the already privileged CRM server.
-- A user JWT or publishable key cannot invoke these functions directly.
REVOKE ALL ON FUNCTION public.crm_sd_list_tickets_v1(uuid,uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_create_ticket_v1(uuid,uuid,uuid,uuid,text,text,text)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_transition_ticket_v1(uuid,uuid,uuid,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crm_sd_list_tickets_v1(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_create_ticket_v1(uuid,uuid,uuid,uuid,text,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_transition_ticket_v1(uuid,uuid,uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION service_desk.require_actor(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION service_desk.assert_ticket_scope() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION service_desk.require_actor(uuid,uuid,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION service_desk.assert_ticket_scope() TO service_role;
COMMIT;
