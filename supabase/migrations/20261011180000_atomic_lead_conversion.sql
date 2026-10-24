-- #117: atomic, tenant-scoped lead conversion. PREPARED ONLY.
-- Deployment requires CRM schema review, Supabase advisors and a HUMAN production gate.
-- A function call is one PostgreSQL transaction; any error rolls back every write.
BEGIN;

CREATE TABLE IF NOT EXISTS public.lead_conversion_receipts (
    lead_id uuid PRIMARY KEY,
    organization_id uuid NOT NULL,
    account_id uuid NOT NULL,
    contact_id uuid NOT NULL,
    deal_id uuid NOT NULL,
    request_hash text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lead_conversion_receipts_org_idx
    ON public.lead_conversion_receipts (organization_id);
ALTER TABLE public.lead_conversion_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_conversion_receipts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.lead_conversion_receipts TO service_role;

CREATE OR REPLACE FUNCTION public.convert_lead_to_deal_atomic(
    p_actor_id uuid,
    p_org_id uuid,
    p_lead_id uuid,
    p_input jsonb
)
RETURNS TABLE (account_id uuid, contact_id uuid, deal_id uuid, replayed boolean)
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $lead_conversion$
DECLARE
    v_lead public.leads%ROWTYPE;
    v_receipt public.lead_conversion_receipts%ROWTYPE;
    v_account_id uuid;
    v_contact_id uuid;
    v_deal_id uuid;
    v_company text;
    v_contact_name text;
    v_interest text;
    v_hash text;
    v_affected integer;
BEGIN
    IF p_actor_id IS NULL OR p_org_id IS NULL OR p_lead_id IS NULL
       OR p_input IS NULL OR jsonb_typeof(p_input) <> 'object'
       OR length(p_input::text) > 10000 THEN
        RAISE EXCEPTION 'Invalid lead conversion request' USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1 FROM jsonb_each(p_input) AS item(key, value)
        WHERE item.key <> ALL (ARRAY[
            'company','contact_name','email','phone','interest','cnpj','ie',
            'zip','street','number','complement','neighborhood','city','state'
        ])
        OR jsonb_typeof(item.value) NOT IN ('string','null')
    ) THEN
        RAISE EXCEPTION 'Unsupported lead conversion fields' USING ERRCODE = '22023';
    END IF;

    -- The service-role RPC is only callable by the privileged server and
    -- independently rechecks the trusted actor's active tenant membership.
    PERFORM 1 FROM public.profiles
      WHERE id = p_actor_id AND organization_id = p_org_id AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead conversion actor is not active in tenant'
            USING ERRCODE = '42501';
    END IF;

    -- Serializes concurrent retries for the same lead. No writes precede this lock.
    SELECT * INTO v_lead
      FROM public.leads
      WHERE id = p_lead_id AND organization_id = p_org_id
      FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lead does not exist in tenant' USING ERRCODE = 'P0002';
    END IF;

    v_hash := encode(sha256(convert_to(p_input::text, 'UTF8')), 'hex');
    SELECT * INTO v_receipt FROM public.lead_conversion_receipts
      WHERE lead_id = p_lead_id AND organization_id = p_org_id;
    IF FOUND THEN
        IF v_receipt.request_hash <> v_hash THEN
            RAISE EXCEPTION 'Lead already converted with a different request'
                USING ERRCODE = '23505';
        END IF;
        RETURN QUERY SELECT v_receipt.account_id, v_receipt.contact_id,
                            v_receipt.deal_id, true;
        RETURN;
    END IF;

    -- An old conversion without a receipt cannot safely be replayed.
    IF v_lead.status = 'Convertido' THEN
        RAISE EXCEPTION 'Converted lead has no verifiable conversion receipt'
            USING ERRCODE = '23505';
    END IF;

    v_company := COALESCE(NULLIF(btrim(p_input->>'company'), ''),
                          NULLIF(btrim(v_lead.company), ''));
    v_contact_name := COALESCE(NULLIF(btrim(p_input->>'contact_name'), ''),
                               NULLIF(btrim(v_lead.contact_name), ''));
    v_interest := COALESCE(NULLIF(btrim(p_input->>'interest'), ''),
                           NULLIF(btrim(v_lead.interest), ''), 'Novos Produtos');
    IF v_company IS NULL OR v_contact_name IS NULL
       OR length(v_company) > 250 OR length(v_contact_name) > 250 THEN
        RAISE EXCEPTION 'Required lead conversion data missing' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.accounts (
        organization_id, name, cnpj, ie, zip, street, number, complement,
        neighborhood, city, state, industry, status
    ) VALUES (
        p_org_id, v_company, COALESCE(p_input->>'cnpj', v_lead.cnpj),
        COALESCE(p_input->>'ie', v_lead.ie),
        COALESCE(p_input->>'zip', v_lead.zip),
        COALESCE(p_input->>'street', v_lead.street),
        COALESCE(p_input->>'number', v_lead.number),
        COALESCE(p_input->>'complement', v_lead.complement),
        COALESCE(p_input->>'neighborhood', v_lead.neighborhood),
        COALESCE(p_input->>'city', v_lead.city),
        COALESCE(p_input->>'state', v_lead.state),
        v_interest, 'Ativo'
    ) RETURNING id INTO v_account_id;

    INSERT INTO public.account_contacts (
        organization_id, account_id, name, email, mobile_phone, role, is_primary
    ) VALUES (
        p_org_id, v_account_id, v_contact_name,
        COALESCE(p_input->>'email', v_lead.email),
        COALESCE(p_input->>'phone', v_lead.phone),
        'Contato Comercial', true
    ) RETURNING id INTO v_contact_id;

    INSERT INTO public.deals (
        organization_id, title, account_id, status, value,
        probability, close_date, owner_id
    ) VALUES (
        p_org_id, 'Oportunidade: ' || v_interest, v_account_id, 'qualification',
        10000, 30, now() + interval '30 days', p_actor_id
    ) RETURNING id INTO v_deal_id;

    UPDATE public.leads
    SET status = 'Convertido',
        company = v_company,
        contact_name = v_contact_name,
        interest = v_interest,
        email = COALESCE(p_input->>'email', v_lead.email),
        phone = COALESCE(p_input->>'phone', v_lead.phone),
        cnpj = COALESCE(p_input->>'cnpj', v_lead.cnpj),
        ie = COALESCE(p_input->>'ie', v_lead.ie),
        zip = COALESCE(p_input->>'zip', v_lead.zip),
        street = COALESCE(p_input->>'street', v_lead.street),
        number = COALESCE(p_input->>'number', v_lead.number),
        complement = COALESCE(p_input->>'complement', v_lead.complement),
        neighborhood = COALESCE(p_input->>'neighborhood', v_lead.neighborhood),
        city = COALESCE(p_input->>'city', v_lead.city),
        state = COALESCE(p_input->>'state', v_lead.state)
    WHERE id = p_lead_id AND organization_id = p_org_id
      AND status IS DISTINCT FROM 'Convertido';
    GET DIAGNOSTICS v_affected = ROW_COUNT;
    IF v_affected <> 1 THEN
        RAISE EXCEPTION 'Lead state changed during conversion' USING ERRCODE = '40001';
    END IF;

    INSERT INTO public.lead_conversion_receipts
        (lead_id, organization_id, account_id, contact_id, deal_id, request_hash)
    VALUES (p_lead_id, p_org_id, v_account_id, v_contact_id, v_deal_id, v_hash);
    RETURN QUERY SELECT v_account_id, v_contact_id, v_deal_id, false;
END;
$lead_conversion$;

REVOKE ALL ON FUNCTION public.convert_lead_to_deal_atomic(uuid,uuid,uuid,jsonb)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_lead_to_deal_atomic(uuid,uuid,uuid,jsonb)
    TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
