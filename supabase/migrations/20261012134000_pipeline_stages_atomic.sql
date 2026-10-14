-- Prepared only. CRM production migration requires schema validation and human gate.
BEGIN;
CREATE TABLE IF NOT EXISTS public.pipeline_stage_revisions (
  organization_id uuid PRIMARY KEY,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
ALTER TABLE public.pipeline_stage_revisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pipeline_stage_revisions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pipeline_stage_revisions TO service_role;

CREATE OR REPLACE FUNCTION public.get_pipeline_stage_snapshot_atomic(
 p_actor_id uuid, p_org_id uuid
) RETURNS TABLE(revision bigint, stages jsonb)
LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path=pg_catalog,public
AS $fn$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=p_actor_id AND p.organization_id=p_org_id AND p.status='active')
 THEN RAISE EXCEPTION 'Unauthorized pipeline reader' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT
   COALESCE((SELECT r.revision FROM public.pipeline_stage_revisions r WHERE r.organization_id=p_org_id),0),
   COALESCE((SELECT jsonb_agg(jsonb_build_object('id',s.id,'name',s.name,
     'color',s.color,'order_index',s.order_index) ORDER BY s.order_index,s.id)
     FROM public.pipeline_stages s WHERE s.organization_id=p_org_id),'[]'::jsonb);
END;
$fn$;

CREATE OR REPLACE FUNCTION public.replace_pipeline_stages_atomic(
 p_actor_id uuid, p_org_id uuid, p_expected_revision bigint, p_stages jsonb
) RETURNS TABLE(revision bigint)
LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path=pg_catalog,public
AS $fn$
DECLARE
 v_revision bigint;
 v_item jsonb;
 v_count integer;
 v_stage_id uuid;
 v_name text;
BEGIN
 IF p_actor_id IS NULL OR p_org_id IS NULL OR p_expected_revision IS NULL OR p_expected_revision<0
   OR p_stages IS NULL OR jsonb_typeof(p_stages)<>'array'
   OR jsonb_array_length(p_stages) NOT BETWEEN 1 AND 30 OR length(p_stages::text)>16000
 THEN RAISE EXCEPTION 'Invalid pipeline transaction' USING ERRCODE='22023'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.profiles p
    WHERE p.id=p_actor_id AND p.organization_id=p_org_id AND p.status='active')
 THEN RAISE EXCEPTION 'Unauthorized pipeline editor' USING ERRCODE='42501'; END IF;
 -- A stable per-tenant row serializes concurrent writers, including first save.
 INSERT INTO public.pipeline_stage_revisions(organization_id,revision) VALUES(p_org_id,0)
 ON CONFLICT (organization_id) DO NOTHING;
 SELECT r.revision INTO v_revision FROM public.pipeline_stage_revisions r
 WHERE r.organization_id=p_org_id FOR UPDATE;
 IF v_revision<>p_expected_revision
 THEN RAISE EXCEPTION 'Stale pipeline revision' USING ERRCODE='40001'; END IF;

 CREATE TEMP TABLE IF NOT EXISTS pg_temp.pipeline_requested_stages (
    id uuid PRIMARY KEY, name text NOT NULL, color text NOT NULL, order_index integer NOT NULL
 ) ON COMMIT DROP;
 TRUNCATE pg_temp.pipeline_requested_stages;
 v_count:=0;
 FOR v_item IN SELECT value FROM jsonb_array_elements(p_stages) LOOP
  IF jsonb_typeof(v_item)<>'object'
   OR EXISTS(SELECT 1 FROM jsonb_object_keys(v_item) AS k WHERE k<>ALL(ARRAY['id','name','color']))
   OR jsonb_typeof(v_item->'id')<>'string'
   OR (v_item->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
   OR jsonb_typeof(v_item->'name')<>'string'
   OR length(btrim(v_item->>'name')) NOT BETWEEN 1 AND 100
   OR jsonb_typeof(v_item->'color')<>'string'
   OR (v_item->>'color') !~ '^#[0-9a-fA-F]{6}$'
  THEN RAISE EXCEPTION 'Malformed pipeline stage' USING ERRCODE='22023'; END IF;
  v_stage_id:=(v_item->>'id')::uuid;
  v_name:=btrim(v_item->>'name');
  IF EXISTS(SELECT 1 FROM pg_temp.pipeline_requested_stages s WHERE lower(s.name)=lower(v_name))
  THEN RAISE EXCEPTION 'Duplicate pipeline stage name' USING ERRCODE='22023'; END IF;
  -- Reject an ID already assigned to a different organization.
  IF EXISTS(SELECT 1 FROM public.pipeline_stages s
    WHERE s.id=v_stage_id AND s.organization_id IS DISTINCT FROM p_org_id)
  THEN RAISE EXCEPTION 'Foreign pipeline stage ID' USING ERRCODE='42501'; END IF;
  INSERT INTO pg_temp.pipeline_requested_stages(id,name,color,order_index)
   VALUES(v_stage_id,v_name,v_item->>'color',v_count);
  v_count:=v_count+1;
 END LOOP;

 -- Custom deal.stage values are immutable stage UUIDs; older deals can
 -- still contain editable names and the legacy English status keys. Reject a
 -- delete whenever any reference exists. Reject a rename only when name/legacy
 -- references would become detached; UUID-linked deals survive safe renames.
 IF EXISTS (
 SELECT 1 FROM public.pipeline_stages old
 WHERE old.organization_id=p_org_id
   AND (
     (NOT EXISTS (
       SELECT 1 FROM pg_temp.pipeline_requested_stages requested
       WHERE requested.id=old.id
     ) AND EXISTS (
       SELECT 1 FROM public.deals d
       WHERE d.organization_id=p_org_id AND (
         d.stage=old.id::text OR d.stage=old.name
         OR (lower(old.name)='qualificação' AND d.stage='qualification')
         OR (lower(old.name)='proposta' AND d.stage='proposal')
         OR (lower(old.name)='negociação' AND d.stage='negotiation')
       )
     ))
     OR
     (EXISTS (
       SELECT 1 FROM pg_temp.pipeline_requested_stages requested
       WHERE requested.id=old.id AND requested.name IS DISTINCT FROM old.name
     ) AND EXISTS (
       SELECT 1 FROM public.deals d
       WHERE d.organization_id=p_org_id AND (
         d.stage=old.name
         OR (lower(old.name)='qualificação' AND d.stage='qualification')
         OR (lower(old.name)='proposta' AND d.stage='proposal')
         OR (lower(old.name)='negociação' AND d.stage='negotiation')
       )
     ))
   )
 )
 THEN RAISE EXCEPTION 'Existing deals still use changed stage' USING ERRCODE='23503'; END IF;

 -- Prevent cross-tenant collisions and partial changes. All writes are one txn.
 DELETE FROM public.pipeline_stages old
 WHERE old.organization_id=p_org_id
  AND NOT EXISTS(SELECT 1 FROM pg_temp.pipeline_requested_stages requested WHERE requested.id=old.id);
 INSERT INTO public.pipeline_stages(id,organization_id,name,color,order_index)
 SELECT id,p_org_id,name,color,order_index FROM pg_temp.pipeline_requested_stages
 ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,color=EXCLUDED.color,
    order_index=EXCLUDED.order_index
 WHERE public.pipeline_stages.organization_id=p_org_id;
 GET DIAGNOSTICS v_count=ROW_COUNT;
 IF v_count<>(SELECT count(*) FROM pg_temp.pipeline_requested_stages)
 THEN RAISE EXCEPTION 'Pipeline stage write mismatch' USING ERRCODE='40001'; END IF;
 UPDATE public.pipeline_stage_revisions AS r SET revision=r.revision+1
 WHERE r.organization_id=p_org_id RETURNING r.revision INTO v_revision;
 RETURN QUERY SELECT v_revision;
END;
$fn$;
REVOKE ALL ON FUNCTION public.get_pipeline_stage_snapshot_atomic(uuid,uuid)
 FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.replace_pipeline_stages_atomic(uuid,uuid,bigint,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_pipeline_stage_snapshot_atomic(uuid,uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.replace_pipeline_stages_atomic(uuid,uuid,bigint,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;