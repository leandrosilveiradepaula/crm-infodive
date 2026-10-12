-- Prepared for #119; production requires schema review and human migration gate.
BEGIN;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS aggregate_revision bigint NOT NULL DEFAULT 1;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.upsert_account_aggregate_atomic(
 p_actor_id uuid, p_org_id uuid, p_account_id uuid, p_expected_revision bigint,
 p_fields jsonb, p_contacts jsonb, p_branches jsonb
)
RETURNS TABLE(account_id uuid, aggregate_revision bigint)
LANGUAGE plpgsql VOLATILE SECURITY INVOKER
SET search_path = pg_catalog, public
AS $account_rpc$
DECLARE
 v_id uuid;
 v_revision bigint;
 v_key text;
 v_item jsonb;
 v_contact_id uuid;
 v_branch_id uuid;
 v_contact_keep uuid[] := ARRAY[]::uuid[];
 v_branch_keep uuid[] := ARRAY[]::uuid[];
BEGIN
 IF p_actor_id IS NULL OR p_org_id IS NULL OR p_fields IS NULL OR
    jsonb_typeof(p_fields) <> 'object' OR length(p_fields::text)>20000 OR
    (p_contacts IS NOT NULL AND (jsonb_typeof(p_contacts)<>'array' OR jsonb_array_length(p_contacts)>100)) OR
    (p_branches IS NOT NULL AND (jsonb_typeof(p_branches)<>'array' OR jsonb_array_length(p_branches)>100)) THEN
  RAISE EXCEPTION 'Invalid account aggregate' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM public.profiles
 WHERE id=p_actor_id AND organization_id=p_org_id AND status='active';
 IF NOT FOUND THEN RAISE EXCEPTION 'Inactive or foreign actor' USING ERRCODE='42501'; END IF;
 FOR v_key IN SELECT jsonb_object_keys(p_fields) LOOP
   IF v_key <> ALL(ARRAY['name','cnpj','ie','segment','status','zip','street','number',
     'complement','neighborhood','city','state','tags','relationship_type','logo_url','payment_terms']) THEN
       RAISE EXCEPTION 'Unsupported account field' USING ERRCODE='22023';
   END IF;
 END LOOP;
 IF p_fields ? 'tags' AND jsonb_typeof(p_fields->'tags') <> 'array' THEN
  RAISE EXCEPTION 'Invalid tags' USING ERRCODE='22023';
 END IF;
 IF p_account_id IS NULL THEN
   IF p_expected_revision IS NOT NULL OR NULLIF(btrim(p_fields->>'name'),'') IS NULL THEN
    RAISE EXCEPTION 'Account name or create version missing' USING ERRCODE='22023';
   END IF;
   INSERT INTO public.accounts (
     organization_id,name,cnpj,ie,segment,status,zip,street,number,
     complement,neighborhood,city,state,tags,relationship_type,logo_url,payment_terms
   ) VALUES (
     p_org_id,p_fields->>'name',p_fields->>'cnpj',p_fields->>'ie',
     p_fields->>'segment',COALESCE(p_fields->>'status','Ativo'),
     p_fields->>'zip',p_fields->>'street',p_fields->>'number',
     p_fields->>'complement',p_fields->>'neighborhood',p_fields->>'city',
     p_fields->>'state',
     CASE WHEN p_fields ? 'tags' THEN ARRAY(SELECT jsonb_array_elements_text(p_fields->'tags'))
          ELSE ARRAY[]::text[] END,
     COALESCE(p_fields->>'relationship_type','Cliente'),
     p_fields->>'logo_url',p_fields->>'payment_terms'
   ) RETURNING public.accounts.id, public.accounts.aggregate_revision INTO v_id,v_revision;
 ELSE
   IF p_expected_revision IS NULL OR p_expected_revision<1 THEN
     RAISE EXCEPTION 'Expected revision mandatory' USING ERRCODE='22023';
   END IF;
   SELECT a.id,a.aggregate_revision INTO v_id,v_revision FROM public.accounts AS a
   WHERE a.id=p_account_id AND a.organization_id=p_org_id FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Account not found in tenant' USING ERRCODE='P0002'; END IF;
   IF v_revision<>p_expected_revision THEN
     RAISE EXCEPTION 'Stale aggregate revision' USING ERRCODE='40001';
   END IF;
 END IF;
 -- The account lock serializes aggregate writers; the revision detects stale forms.
 -- Explicit fields only: never assign id, organization_id or audit columns.
 UPDATE public.accounts SET
 name=CASE WHEN p_fields ? 'name' THEN p_fields->>'name' ELSE name END,
 cnpj=CASE WHEN p_fields ? 'cnpj' THEN p_fields->>'cnpj' ELSE cnpj END,
 ie=CASE WHEN p_fields ? 'ie' THEN p_fields->>'ie' ELSE ie END,
 segment=CASE WHEN p_fields ? 'segment' THEN p_fields->>'segment' ELSE segment END,
 status=CASE WHEN p_fields ? 'status' THEN p_fields->>'status' ELSE status END,
 zip=CASE WHEN p_fields ? 'zip' THEN p_fields->>'zip' ELSE zip END,
 street=CASE WHEN p_fields ? 'street' THEN p_fields->>'street' ELSE street END,
 number=CASE WHEN p_fields ? 'number' THEN p_fields->>'number' ELSE number END,
 complement=CASE WHEN p_fields ? 'complement' THEN p_fields->>'complement' ELSE complement END,
 neighborhood=CASE WHEN p_fields ? 'neighborhood' THEN p_fields->>'neighborhood' ELSE neighborhood END,
 city=CASE WHEN p_fields ? 'city' THEN p_fields->>'city' ELSE city END,
 state=CASE WHEN p_fields ? 'state' THEN p_fields->>'state' ELSE state END,
 tags=CASE WHEN p_fields ? 'tags' THEN ARRAY(SELECT jsonb_array_elements_text(p_fields->'tags')) ELSE tags END,
 relationship_type=CASE WHEN p_fields ? 'relationship_type' THEN p_fields->>'relationship_type' ELSE relationship_type END,
 logo_url=CASE WHEN p_fields ? 'logo_url' THEN p_fields->>'logo_url' ELSE logo_url END,
 payment_terms=CASE WHEN p_fields ? 'payment_terms' THEN p_fields->>'payment_terms' ELSE payment_terms END,
 aggregate_revision=public.accounts.aggregate_revision+CASE WHEN p_account_id IS NULL THEN 0 ELSE 1 END
 WHERE id=v_id AND organization_id=p_org_id
 RETURNING public.accounts.aggregate_revision INTO v_revision;

 -- Validate all child IDs and ownership before replacing any part of either
 -- collection. The account row is locked through FOR UPDATE above.
 IF p_contacts IS NOT NULL THEN
   FOR v_item IN SELECT value FROM jsonb_array_elements(p_contacts) LOOP
     IF jsonb_typeof(v_item)<>'object' OR NULLIF(btrim(v_item->>'name'),'') IS NULL
       OR EXISTS(SELECT 1 FROM jsonb_object_keys(v_item) AS k
          WHERE k <> ALL(ARRAY['id','name','email','mobile_phone','landline_phone','role','is_primary']))
       OR (v_item ? 'is_primary' AND jsonb_typeof(v_item->'is_primary')<>'boolean')
     THEN RAISE EXCEPTION 'Invalid contact payload' USING ERRCODE='22023'; END IF;
     IF v_item ? 'id' THEN
       IF jsonb_typeof(v_item->'id') <> 'string'
          OR (v_item->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       THEN RAISE EXCEPTION 'Invalid contact ID' USING ERRCODE='22023'; END IF;
       v_contact_id := (v_item->>'id')::uuid;
       IF v_contact_id = ANY(v_contact_keep) THEN
         RAISE EXCEPTION 'Duplicate contact ID' USING ERRCODE='22023';
       END IF;
       PERFORM 1 FROM public.account_contacts c
          WHERE c.id=v_contact_id AND c.account_id=v_id AND c.organization_id=p_org_id;
       IF NOT FOUND THEN RAISE EXCEPTION 'Contact outside account' USING ERRCODE='P0002'; END IF;
       v_contact_keep := array_append(v_contact_keep,v_contact_id);
     END IF;
   END LOOP;
 END IF;

 IF p_branches IS NOT NULL THEN
   FOR v_item IN SELECT value FROM jsonb_array_elements(p_branches) LOOP
     IF jsonb_typeof(v_item)<>'object' OR NULLIF(btrim(v_item->>'name'),'') IS NULL
       OR EXISTS(SELECT 1 FROM jsonb_object_keys(v_item) AS k
          WHERE k <> ALL(ARRAY['id','name','zip','street','number','complement',
          'neighborhood','city','state','cnpj','ie','payment_terms']))
     THEN RAISE EXCEPTION 'Invalid branch payload' USING ERRCODE='22023'; END IF;
     IF v_item ? 'id' THEN
       IF jsonb_typeof(v_item->'id') <> 'string'
         OR (v_item->>'id') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       THEN RAISE EXCEPTION 'Invalid branch ID' USING ERRCODE='22023'; END IF;
       v_branch_id := (v_item->>'id')::uuid;
       IF v_branch_id = ANY(v_branch_keep) THEN
         RAISE EXCEPTION 'Duplicate branch ID' USING ERRCODE='22023';
       END IF;
       PERFORM 1 FROM public.account_branches b
         WHERE b.id=v_branch_id AND b.account_id=v_id AND b.organization_id=p_org_id;
       IF NOT FOUND THEN RAISE EXCEPTION 'Branch outside account' USING ERRCODE='P0002'; END IF;
       v_branch_keep := array_append(v_branch_keep,v_branch_id);
     END IF;
   END LOOP;
 END IF;

 IF p_contacts IS NOT NULL THEN
   -- Retained rows update in place. Missing rows may be deleted only when
   -- foreign keys allow it; FK failure aborts the WHOLE transaction.
   DELETE FROM public.account_contacts c
      WHERE c.account_id=v_id AND c.organization_id=p_org_id
        AND NOT(c.id=ANY(v_contact_keep));
   FOR v_item IN SELECT value FROM jsonb_array_elements(p_contacts) LOOP
     IF v_item ? 'id' THEN
       v_contact_id := (v_item->>'id')::uuid;
       UPDATE public.account_contacts c SET
         name=v_item->>'name',
         email=CASE WHEN v_item ? 'email' THEN v_item->>'email' ELSE c.email END,
         mobile_phone=CASE WHEN v_item ? 'mobile_phone' THEN v_item->>'mobile_phone' ELSE c.mobile_phone END,
         landline_phone=CASE WHEN v_item ? 'landline_phone' THEN v_item->>'landline_phone' ELSE c.landline_phone END,
         role=CASE WHEN v_item ? 'role' THEN v_item->>'role' ELSE c.role END,
         is_primary=CASE WHEN v_item ? 'is_primary'
           THEN (v_item->>'is_primary')::boolean ELSE c.is_primary END
         WHERE c.id=v_contact_id AND c.account_id=v_id AND c.organization_id=p_org_id;
     ELSE
       INSERT INTO public.account_contacts(
          account_id,organization_id,name,email,mobile_phone,landline_phone,role,is_primary
       ) VALUES (
          v_id,p_org_id,v_item->>'name',v_item->>'email',v_item->>'mobile_phone',
          v_item->>'landline_phone',v_item->>'role',COALESCE((v_item->>'is_primary')::boolean,false)
       );
     END IF;
   END LOOP;
 END IF;

 IF p_branches IS NOT NULL THEN
   DELETE FROM public.account_branches b
      WHERE b.account_id=v_id AND b.organization_id=p_org_id
        AND NOT(b.id=ANY(v_branch_keep));
   FOR v_item IN SELECT value FROM jsonb_array_elements(p_branches) LOOP
     IF v_item ? 'id' THEN
       v_branch_id := (v_item->>'id')::uuid;
       UPDATE public.account_branches b SET
         name=v_item->>'name',
         zip=CASE WHEN v_item ? 'zip' THEN v_item->>'zip' ELSE b.zip END,
         street=CASE WHEN v_item ? 'street' THEN v_item->>'street' ELSE b.street END,
         number=CASE WHEN v_item ? 'number' THEN v_item->>'number' ELSE b.number END,
         complement=CASE WHEN v_item ? 'complement' THEN v_item->>'complement' ELSE b.complement END,
         neighborhood=CASE WHEN v_item ? 'neighborhood' THEN v_item->>'neighborhood' ELSE b.neighborhood END,
         city=CASE WHEN v_item ? 'city' THEN v_item->>'city' ELSE b.city END,
         state=CASE WHEN v_item ? 'state' THEN v_item->>'state' ELSE b.state END,
         cnpj=CASE WHEN v_item ? 'cnpj' THEN v_item->>'cnpj' ELSE b.cnpj END,
         ie=CASE WHEN v_item ? 'ie' THEN v_item->>'ie' ELSE b.ie END,
         payment_terms=CASE WHEN v_item ? 'payment_terms'
           THEN v_item->>'payment_terms' ELSE b.payment_terms END
         WHERE b.id=v_branch_id AND b.account_id=v_id AND b.organization_id=p_org_id;
     ELSE
       INSERT INTO public.account_branches(
         account_id,organization_id,name,zip,street,number,complement,
         neighborhood,city,state,cnpj,ie,payment_terms
       ) VALUES (
         v_id,p_org_id,v_item->>'name',v_item->>'zip',v_item->>'street',
         v_item->>'number',v_item->>'complement',v_item->>'neighborhood',
         v_item->>'city',v_item->>'state',v_item->>'cnpj',v_item->>'ie',v_item->>'payment_terms'
       );
     END IF;
   END LOOP;
 END IF;
 RETURN QUERY SELECT v_id,v_revision;
END;
$account_rpc$;
REVOKE ALL ON FUNCTION public.upsert_account_aggregate_atomic(uuid,uuid,uuid,bigint,jsonb,jsonb,jsonb)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_account_aggregate_atomic(uuid,uuid,uuid,bigint,jsonb,jsonb,jsonb)
TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;