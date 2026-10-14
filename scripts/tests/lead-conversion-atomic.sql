-- Execute with ON_ERROR_STOP and a disposable DB. DO/EXCEPTION subtransactions
-- prove PostgreSQL rollback on contact and deal failures.
BEGIN;
SET LOCAL ROLE service_role;
DO $test$
DECLARE r record; again record; n integer;
BEGIN
    SELECT * INTO r FROM public.convert_lead_to_deal_atomic(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      '{"company":"Acme","contact_name":"Ana"}');
    IF r.replayed OR r.account_id IS NULL OR r.contact_id IS NULL OR r.deal_id IS NULL THEN
        RAISE EXCEPTION 'First conversion receipt invalid';
    END IF;
    SELECT * INTO again FROM public.convert_lead_to_deal_atomic(
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      '{"company":"Acme","contact_name":"Ana"}');
    IF NOT again.replayed OR again.account_id <> r.account_id
       OR again.contact_id <> r.contact_id OR again.deal_id <> r.deal_id THEN
        RAISE EXCEPTION 'Idempotent replay duplicated or altered identifiers';
    END IF;
    SELECT count(*) INTO n FROM public.accounts;
    IF n <> 1 THEN RAISE EXCEPTION 'Replay created duplicate accounts'; END IF;

    BEGIN
      PERFORM public.convert_lead_to_deal_atomic(
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111111', '{"company":"Alterada"}');
      RAISE EXCEPTION 'Different replay was accepted';
    EXCEPTION WHEN unique_violation THEN NULL;
    END;

    BEGIN
      PERFORM public.convert_lead_to_deal_atomic(
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111112',
        '{"contact_name":"Falha Contato"}');
      RAISE EXCEPTION 'Contact failure did not abort';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    BEGIN
      PERFORM public.convert_lead_to_deal_atomic(
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111113',
        '{"interest":"Falha Negocio"}');
      RAISE EXCEPTION 'Deal failure did not abort';
    EXCEPTION WHEN check_violation THEN NULL;
    END;
    SELECT count(*) INTO n FROM public.accounts;
    IF n <> 1 THEN RAISE EXCEPTION 'Partial account writes survived rollback'; END IF;
    SELECT count(*) INTO n FROM public.lead_conversion_receipts;
    IF n <> 1 THEN RAISE EXCEPTION 'Failed conversion wrote receipt'; END IF;
    SELECT count(*) INTO n FROM public.leads
      WHERE id IN ('11111111-1111-4111-8111-111111111112',
                   '11111111-1111-4111-8111-111111111113') AND status = 'Novo';
    IF n <> 2 THEN RAISE EXCEPTION 'Failed conversions mutated lead state'; END IF;

    BEGIN
      PERFORM public.convert_lead_to_deal_atomic(
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111114', '{}');
      RAISE EXCEPTION 'Cross-tenant lead accessible';
    EXCEPTION WHEN no_data_found THEN NULL;
    END;
    BEGIN
      PERFORM public.convert_lead_to_deal_atomic(
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        '11111111-1111-4111-8111-111111111114', '{}');
      RAISE EXCEPTION 'Inactive actor accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL;
    END;
    BEGIN
      PERFORM public.convert_lead_to_deal_atomic(
        'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        '11111111-1111-4111-8111-111111111115', '{"organization_id":"other"}');
      RAISE EXCEPTION 'Privileged payload accepted';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;
END;
$test$;
COMMIT;
RESET ROLE;
DO $acl$
BEGIN
  IF has_function_privilege('anon',
       'public.convert_lead_to_deal_atomic(uuid,uuid,uuid,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated',
       'public.convert_lead_to_deal_atomic(uuid,uuid,uuid,jsonb)', 'EXECUTE')
    OR has_table_privilege('authenticated', 'public.lead_conversion_receipts', 'SELECT')
  THEN
    RAISE EXCEPTION 'RPC/receipt privileged ACL regression';
  END IF;
END;
$acl$;
SELECT 'LEAD_CONVERSION_TRANSACTION_PASS' AS result;
