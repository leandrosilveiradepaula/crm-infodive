BEGIN;
SET LOCAL ROLE service_role;
DO $t$
DECLARE a record; n integer; rev bigint;
BEGIN
 SELECT * INTO a FROM public.upsert_account_aggregate_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',NULL,NULL,
 '{"name":"Acme"}',
 '[{"name":"Original"}]'::jsonb,
 '[{"name":"Filial"}]'::jsonb);
 IF a.aggregate_revision<>1 OR a.account_id IS NULL THEN RAISE EXCEPTION 'Create receipt invalid'; END IF;
 BEGIN
 PERFORM public.upsert_account_aggregate_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',a.account_id,1,
 '{"city":"Porto Alegre"}',
 '[{"name":"Novo"}]'::jsonb,
 '[{"name":"Fail Branch"}]'::jsonb);
 RAISE EXCEPTION 'Branch failure was accepted';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 SELECT aggregate_revision INTO rev FROM public.accounts WHERE id=a.account_id;
 IF rev<>1 THEN RAISE EXCEPTION 'Partial revision update'; END IF;
 SELECT count(*) INTO n FROM public.account_contacts WHERE account_id=a.account_id AND name='Original';
 IF n<>1 THEN RAISE EXCEPTION 'Old contacts were not restored by rollback'; END IF;
 SELECT * INTO a FROM public.upsert_account_aggregate_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',a.account_id,1,
 '{"city":"Porto Alegre"}',
 '[{"name":"Novo"}]'::jsonb,NULL);
 IF a.aggregate_revision<>2 THEN RAISE EXCEPTION 'Revision not incremented'; END IF;
 BEGIN
 PERFORM public.upsert_account_aggregate_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',a.account_id,1,'{"city":"Stale"}',NULL,NULL);
 RAISE EXCEPTION 'Stale revision was accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;
 END;
 SELECT count(*) INTO n FROM public.account_contacts WHERE account_id=a.account_id AND name='Novo';
 IF n<>1 THEN RAISE EXCEPTION 'Contact replacement inconsistent'; END IF;
 BEGIN
 PERFORM public.upsert_account_aggregate_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',a.account_id,2,'{"city":"Other"}',NULL,NULL);
 RAISE EXCEPTION 'Cross-tenant actor accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;
END
$t$;
COMMIT;
RESET ROLE;
DO $acl$
BEGIN
IF has_function_privilege('anon','public.upsert_account_aggregate_atomic(uuid,uuid,uuid,bigint,jsonb,jsonb,jsonb)','EXECUTE')
 OR has_function_privilege('authenticated','public.upsert_account_aggregate_atomic(uuid,uuid,uuid,bigint,jsonb,jsonb,jsonb)','EXECUTE')
THEN RAISE EXCEPTION 'RPC grants are too broad'; END IF;
END
$acl$;
SELECT 'ACCOUNT_TRANSACTION_PASS' AS result;
