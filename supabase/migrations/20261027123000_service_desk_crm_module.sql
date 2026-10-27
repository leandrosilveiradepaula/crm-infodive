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
-- SLA calendars and immutable rule snapshots are scoped to existing CRM contracts.
CREATE TABLE service_desk.sla_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  timezone text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('24x7','business_hours')),
  weekdays integer[] NOT NULL DEFAULT ARRAY[1,2,3,4,5],
  start_minute integer NOT NULL DEFAULT 540 CHECK (start_minute BETWEEN 0 AND 1439),
  end_minute integer NOT NULL DEFAULT 1080 CHECK (end_minute BETWEEN 1 AND 1440),
  holidays date[] NOT NULL DEFAULT ARRAY[]::date[],
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id,id),
  UNIQUE (organization_id,name),
  CHECK (end_minute > start_minute),
  CHECK (weekdays <@ ARRAY[1,2,3,4,5,6,7]::integer[])
);
CREATE TABLE service_desk.sla_rule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES public.service_contracts(id) ON DELETE RESTRICT,
  calendar_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  priority text NOT NULL CHECK (priority IN ('low','normal','high','urgent')),
  first_response_minutes integer NOT NULL CHECK (first_response_minutes BETWEEN 0 AND 100800),
  update_minutes integer NOT NULL CHECK (update_minutes BETWEEN 0 AND 100800),
  resolution_minutes integer NOT NULL CHECK (resolution_minutes BETWEEN 0 AND 100800),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  UNIQUE (organization_id,id),
  UNIQUE (contract_id,version,priority),
  FOREIGN KEY (organization_id,calendar_id)
    REFERENCES service_desk.sla_calendars(organization_id,id) ON DELETE RESTRICT,
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);
CREATE UNIQUE INDEX service_desk_active_rule_contract_priority
 ON service_desk.sla_rule_versions(contract_id,priority) WHERE valid_to IS NULL;

CREATE TABLE service_desk.ticket_sla_targets (
  ticket_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES public.service_contracts(id) ON DELETE RESTRICT,
  rule_version_id uuid NOT NULL,
  first_response_at timestamptz NOT NULL,
  update_at timestamptz NOT NULL,
  resolution_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (organization_id,ticket_id)
    REFERENCES service_desk.tickets(organization_id,id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id,rule_version_id)
    REFERENCES service_desk.sla_rule_versions(organization_id,id) ON DELETE RESTRICT
);
CREATE TABLE service_desk.sla_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  rule_version_id uuid NOT NULL,
  event_type text NOT NULL CHECK(event_type IN ('started','paused','resumed','breached','met','reopened')),
  idempotency_key text NOT NULL CHECK (char_length(btrim(idempotency_key)) BETWEEN 1 AND 160),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(detail)='object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_id,idempotency_key),
  FOREIGN KEY (organization_id,ticket_id)
    REFERENCES service_desk.tickets(organization_id,id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id,rule_version_id)
    REFERENCES service_desk.sla_rule_versions(organization_id,id) ON DELETE RESTRICT
);
CREATE TABLE service_desk.sla_pauses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  rule_version_id uuid NOT NULL,
  reason text NOT NULL CHECK(char_length(btrim(reason)) BETWEEN 1 AND 500),
  paused_at timestamptz NOT NULL DEFAULT now(),
  resumed_at timestamptz,
  created_by_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  FOREIGN KEY (organization_id,ticket_id)
    REFERENCES service_desk.tickets(organization_id,id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id,rule_version_id)
    REFERENCES service_desk.sla_rule_versions(organization_id,id) ON DELETE RESTRICT,
  CHECK (resumed_at IS NULL OR resumed_at >= paused_at)
);
CREATE UNIQUE INDEX service_desk_single_open_sla_pause
 ON service_desk.sla_pauses(ticket_id) WHERE resumed_at IS NULL;
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

-- Compute SLA due timestamps using real timezone transitions. The loop is
-- bounded and fails closed if a calendar has no reachable working minute.
CREATE FUNCTION service_desk.sla_due_at(
  p_start timestamptz,p_minutes integer,p_calendar uuid
) RETURNS timestamptz LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path='' AS $calc$
DECLARE
  v_cal service_desk.sla_calendars%ROWTYPE;
  v_cursor timestamptz:=p_start;
  v_local timestamp;
  v_steps integer:=0;
  v_remaining integer:=p_minutes;
  v_weekday integer;
  v_minute integer;
BEGIN
  SELECT * INTO v_cal FROM service_desk.sla_calendars WHERE id=p_calendar;
  IF NOT FOUND OR p_start IS NULL OR p_minutes IS NULL OR
     p_minutes NOT BETWEEN 0 AND 100800
  THEN RAISE EXCEPTION 'Invalid SLA calendar or duration' USING errcode='22023'; END IF;
  IF v_cal.kind='24x7' THEN
    RETURN p_start + make_interval(mins=>p_minutes);
  END IF;
  WHILE v_remaining>0 LOOP
    IF v_steps>527040 THEN
      RAISE EXCEPTION 'SLA calendar has insufficient working hours' USING errcode='22023';
    END IF;
    v_local:=v_cursor AT TIME ZONE v_cal.timezone;
    v_weekday:=extract(isodow from v_local)::integer;
    v_minute:=extract(hour from v_local)::integer*60+
              extract(minute from v_local)::integer;
    IF v_weekday=ANY(v_cal.weekdays)
       AND NOT (v_local::date=ANY(v_cal.holidays))
       AND v_minute>=v_cal.start_minute AND v_minute<v_cal.end_minute
    THEN
      v_remaining:=v_remaining-1;
    END IF;
    v_cursor:=v_cursor+interval '1 minute';
    v_steps:=v_steps+1;
  END LOOP;
  RETURN v_cursor;
END;
$calc$;
REVOKE ALL ON FUNCTION service_desk.sla_due_at(timestamptz,integer,uuid)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION service_desk.sla_due_at(timestamptz,integer,uuid) TO service_role;

-- All persisted rule/calendar relationships must match CRM tenancy even if
-- a future privileged integration bypasses the public RPC.
CREATE FUNCTION service_desk.validate_sla_domain()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $scope_sla$
BEGIN
  IF TG_TABLE_NAME='sla_calendars' THEN
    IF NOT EXISTS(SELECT 1 FROM pg_catalog.pg_timezone_names tz WHERE tz.name=NEW.timezone)
       OR (NEW.kind='business_hours' AND cardinality(NEW.weekdays)=0)
    THEN RAISE EXCEPTION 'Invalid SLA timezone/calendar' USING errcode='23514'; END IF;
  ELSIF TG_TABLE_NAME='sla_rule_versions' THEN
    IF TG_OP='UPDATE' AND (
      NEW.organization_id IS DISTINCT FROM OLD.organization_id OR
      NEW.contract_id IS DISTINCT FROM OLD.contract_id OR
      NEW.calendar_id IS DISTINCT FROM OLD.calendar_id OR
      NEW.version IS DISTINCT FROM OLD.version OR
      NEW.priority IS DISTINCT FROM OLD.priority OR
      NEW.first_response_minutes IS DISTINCT FROM OLD.first_response_minutes OR
      NEW.update_minutes IS DISTINCT FROM OLD.update_minutes OR
      NEW.resolution_minutes IS DISTINCT FROM OLD.resolution_minutes OR
      NEW.valid_from IS DISTINCT FROM OLD.valid_from OR OLD.valid_to IS NOT NULL
    ) THEN RAISE EXCEPTION 'SLA rule version is immutable' USING errcode='23514'; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.service_contracts c
      WHERE c.id=NEW.contract_id AND c.organization_id=NEW.organization_id)
    THEN RAISE EXCEPTION 'CRM SLA contract organization mismatch' USING errcode='23514'; END IF;
  ELSIF TG_TABLE_NAME='ticket_sla_targets' THEN
    IF NOT EXISTS(SELECT 1 FROM service_desk.tickets t
      WHERE t.id=NEW.ticket_id AND t.organization_id=NEW.organization_id
        AND t.service_contract_id=NEW.contract_id)
      OR NOT EXISTS(SELECT 1 FROM service_desk.sla_rule_versions r
        WHERE r.id=NEW.rule_version_id AND r.contract_id=NEW.contract_id
          AND r.organization_id=NEW.organization_id)
    THEN RAISE EXCEPTION 'SLA target ticket, rule, contract mismatch' USING errcode='23514'; END IF;
  END IF;
  RETURN NEW;
END;
$scope_sla$;
CREATE TRIGGER service_desk_calendar_scope
  BEFORE INSERT OR UPDATE ON service_desk.sla_calendars
  FOR EACH ROW EXECUTE FUNCTION service_desk.validate_sla_domain();
CREATE TRIGGER service_desk_rule_scope
  BEFORE INSERT OR UPDATE ON service_desk.sla_rule_versions
  FOR EACH ROW EXECUTE FUNCTION service_desk.validate_sla_domain();
CREATE TRIGGER service_desk_target_scope
  BEFORE INSERT OR UPDATE ON service_desk.ticket_sla_targets
  FOR EACH ROW EXECUTE FUNCTION service_desk.validate_sla_domain();
CREATE FUNCTION service_desk.prevent_sla_event_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $immutable_sla$
BEGIN RAISE EXCEPTION 'SLA event history is immutable' USING errcode='42501'; END;
$immutable_sla$;
CREATE TRIGGER service_desk_sla_events_append_only
 BEFORE UPDATE OR DELETE ON service_desk.sla_events FOR EACH ROW
 EXECUTE FUNCTION service_desk.prevent_sla_event_mutation();
REVOKE ALL ON FUNCTION service_desk.validate_sla_domain() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION service_desk.prevent_sla_event_mutation() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION service_desk.validate_sla_domain() TO service_role;
GRANT EXECUTE ON FUNCTION service_desk.prevent_sla_event_mutation() TO service_role;

-- Even if Data API schemas are misconfigured later, anonymous users do not
-- acquire table privileges. RLS is enabled as defense in depth.
DO $rls$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'status_definitions','status_transitions','tickets','ticket_comments',
    'ticket_events','sla_calendars','sla_rule_versions','ticket_sla_targets',
    'sla_events','sla_pauses','knowledge_articles','time_entries','ticket_attachments'
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
  v_rule service_desk.sla_rule_versions%ROWTYPE;
  v_target boolean:=false;
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
  IF p_contract IS NOT NULL THEN
    SELECT * INTO v_rule FROM service_desk.sla_rule_versions r
    WHERE r.organization_id=p_organization AND r.contract_id=p_contract
      AND r.priority=p_priority AND r.valid_from<=v_ticket.created_at
      AND (r.valid_to IS NULL OR r.valid_to>v_ticket.created_at)
    ORDER BY r.valid_from DESC,r.version DESC LIMIT 1;
    IF FOUND THEN
      INSERT INTO service_desk.ticket_sla_targets(
        ticket_id,organization_id,contract_id,rule_version_id,
        first_response_at,update_at,resolution_at
      ) VALUES(v_ticket.id,p_organization,p_contract,v_rule.id,
        service_desk.sla_due_at(v_ticket.created_at,v_rule.first_response_minutes,v_rule.calendar_id),
        service_desk.sla_due_at(v_ticket.created_at,v_rule.update_minutes,v_rule.calendar_id),
        service_desk.sla_due_at(v_ticket.created_at,v_rule.resolution_minutes,v_rule.calendar_id));
      INSERT INTO service_desk.sla_events(
        organization_id,ticket_id,rule_version_id,event_type,idempotency_key)
      VALUES(p_organization,v_ticket.id,v_rule.id,'started','ticket-created');
      v_target:=true;
    END IF;
  END IF;
  RETURN jsonb_build_object('id',v_ticket.id,'ticket_number',v_ticket.ticket_number,
    'sla_configured',v_target);
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

-- Contract time accounting and ticket comments use the same CRM identity,
-- never the former Service Desk's independent users/memberships.
CREATE FUNCTION public.crm_sd_add_comment_v1(
 p_actor uuid,p_organization uuid,p_ticket uuid,p_body text,p_visibility text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $comment$
DECLARE v_id uuid;
BEGIN
  PERFORM service_desk.require_actor(p_actor,p_organization,true);
  IF p_body IS NULL OR char_length(btrim(p_body)) NOT BETWEEN 1 AND 5000
     OR p_visibility NOT IN ('public','internal') OR p_visibility IS NULL
  THEN RAISE EXCEPTION 'Invalid ticket comment' USING errcode='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM service_desk.tickets t
    WHERE t.id=p_ticket AND t.organization_id=p_organization)
  THEN RAISE EXCEPTION 'Ticket unavailable' USING errcode='P0002'; END IF;
  INSERT INTO service_desk.ticket_comments(
    organization_id,ticket_id,author_user_id,body,visibility)
  VALUES(p_organization,p_ticket,p_actor,btrim(p_body),p_visibility)
  RETURNING id INTO v_id;
  INSERT INTO service_desk.ticket_events(
    organization_id,ticket_id,actor_user_id,event_type,
    detail)
  VALUES(p_organization,p_ticket,p_actor,'comment_created',
    jsonb_build_object('comment_id',v_id,'visibility',p_visibility));
  RETURN jsonb_build_object('id',v_id,'ticket_id',p_ticket);
END;
$comment$;

CREATE FUNCTION public.crm_sd_record_time_v1(
 p_actor uuid,p_organization uuid,p_ticket uuid,p_minutes integer,p_description text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $time$
DECLARE v_id uuid;
BEGIN
  PERFORM service_desk.require_actor(p_actor,p_organization,true);
  IF p_minutes IS NULL OR p_minutes < 1 OR p_minutes > 1440
     OR p_description IS NULL OR char_length(btrim(p_description)) NOT BETWEEN 1 AND 5000
  THEN RAISE EXCEPTION 'Invalid work time' USING errcode='22023'; END IF;
  IF NOT EXISTS (SELECT 1 FROM service_desk.tickets t
      WHERE t.id=p_ticket AND t.organization_id=p_organization)
  THEN RAISE EXCEPTION 'Ticket unavailable' USING errcode='P0002'; END IF;
  INSERT INTO service_desk.time_entries(
    organization_id,ticket_id,author_user_id,minutes,description)
  VALUES(p_organization,p_ticket,p_actor,p_minutes,btrim(p_description))
  RETURNING id INTO v_id;
  INSERT INTO service_desk.ticket_events(
    organization_id,ticket_id,actor_user_id,event_type,detail)
  VALUES(p_organization,p_ticket,p_actor,'time_recorded',
    jsonb_build_object('time_entry_id',v_id,'minutes',p_minutes));
  RETURN jsonb_build_object('id',v_id,'ticket_id',p_ticket,'minutes',p_minutes);
END;
$time$;

-- Historical time entry rows must be append-only, including privileged callers.
CREATE FUNCTION service_desk.prevent_time_mutation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $immutable$
BEGIN
  RAISE EXCEPTION 'Work history is append-only' USING errcode='42501';
END;
$immutable$;
CREATE TRIGGER service_desk_time_append_only
  BEFORE UPDATE OR DELETE ON service_desk.time_entries
  FOR EACH ROW EXECUTE FUNCTION service_desk.prevent_time_mutation();
REVOKE ALL ON FUNCTION service_desk.prevent_time_mutation() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION service_desk.prevent_time_mutation() TO service_role;

-- SLA configuration uses existing CRM service contracts. Only CRM admins and
-- managers can create calendars or replace an active rule version.
CREATE FUNCTION public.crm_sd_create_sla_calendar_v1(
 p_actor uuid,p_organization uuid,p_name text,p_timezone text,p_kind text,
 p_weekdays integer[],p_start_minute integer,p_end_minute integer,p_holidays date[]
) RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $cal$
DECLARE v_id uuid;
BEGIN
 PERFORM service_desk.require_actor(p_actor,p_organization,true);
 IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_actor
   AND p.organization_id=p_organization AND p.role IN ('admin','manager'))
 THEN RAISE EXCEPTION 'CRM SLA configuration forbidden' USING errcode='42501'; END IF;
 IF p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 120
    OR p_kind NOT IN ('24x7','business_hours') OR p_kind IS NULL
    OR p_start_minute NOT BETWEEN 0 AND 1439
    OR p_end_minute NOT BETWEEN 1 AND 1440
    OR p_start_minute>=p_end_minute OR p_weekdays IS NULL OR
    NOT p_weekdays<@ARRAY[1,2,3,4,5,6,7]::integer[]
 THEN RAISE EXCEPTION 'Invalid calendar parameters' USING errcode='22023'; END IF;
 INSERT INTO service_desk.sla_calendars(
    organization_id,name,timezone,kind,weekdays,start_minute,end_minute,holidays)
 VALUES(p_organization,btrim(p_name),p_timezone,p_kind,p_weekdays,
    p_start_minute,p_end_minute,coalesce(p_holidays,ARRAY[]::date[]))
 RETURNING id INTO v_id;
 RETURN v_id;
END;
$cal$;
CREATE FUNCTION public.crm_sd_create_sla_rule_v1(
 p_actor uuid,p_organization uuid,p_contract uuid,p_calendar uuid,
 p_priority text,p_first integer,p_update integer,p_resolution integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $rule$
DECLARE v_id uuid;v_version integer;v_now timestamptz:=clock_timestamp();
BEGIN
 PERFORM service_desk.require_actor(p_actor,p_organization,true);
 IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_actor
   AND p.organization_id=p_organization AND p.role IN ('admin','manager'))
 THEN RAISE EXCEPTION 'CRM SLA configuration forbidden' USING errcode='42501'; END IF;
 IF p_priority NOT IN ('low','normal','high','urgent') OR p_priority IS NULL
   OR p_first NOT BETWEEN 0 AND 100800 OR p_update NOT BETWEEN 0 AND 100800
   OR p_resolution NOT BETWEEN 0 AND 100800 OR
   NOT EXISTS(SELECT 1 FROM public.service_contracts c WHERE c.id=p_contract
     AND c.organization_id=p_organization) OR
   NOT EXISTS(SELECT 1 FROM service_desk.sla_calendars c WHERE c.id=p_calendar
     AND c.organization_id=p_organization)
 THEN RAISE EXCEPTION 'CRM SLA contract, calendar or duration invalid' USING errcode='22023'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_contract::text||p_priority,0));
 SELECT coalesce(max(version),0)+1 INTO v_version
   FROM service_desk.sla_rule_versions
   WHERE contract_id=p_contract AND priority=p_priority;
 UPDATE service_desk.sla_rule_versions SET valid_to=v_now
 WHERE contract_id=p_contract AND priority=p_priority AND valid_to IS NULL;
 INSERT INTO service_desk.sla_rule_versions(
  organization_id,contract_id,calendar_id,version,priority,
  first_response_minutes,update_minutes,resolution_minutes,valid_from)
 VALUES(p_organization,p_contract,p_calendar,v_version,p_priority,
  p_first,p_update,p_resolution,v_now) RETURNING id INTO v_id;
 RETURN jsonb_build_object('id',v_id,'version',v_version);
END;
$rule$;
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
REVOKE ALL ON FUNCTION public.crm_sd_add_comment_v1(uuid,uuid,uuid,text,text)
  FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_record_time_v1(uuid,uuid,uuid,integer,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crm_sd_add_comment_v1(uuid,uuid,uuid,text,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_record_time_v1(uuid,uuid,uuid,integer,text) TO service_role;
REVOKE ALL ON FUNCTION public.crm_sd_create_sla_calendar_v1(
 uuid,uuid,text,text,text,integer[],integer,integer,date[])
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.crm_sd_create_sla_rule_v1(
 uuid,uuid,uuid,uuid,text,integer,integer,integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.crm_sd_create_sla_calendar_v1(
 uuid,uuid,text,text,text,integer[],integer,integer,date[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.crm_sd_create_sla_rule_v1(
 uuid,uuid,uuid,uuid,text,integer,integer,integer) TO service_role;
REVOKE ALL ON FUNCTION service_desk.require_actor(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION service_desk.assert_ticket_scope() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION service_desk.require_actor(uuid,uuid,boolean) TO service_role;
GRANT EXECUTE ON FUNCTION service_desk.assert_ticket_scope() TO service_role;
COMMIT;
