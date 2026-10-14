BEGIN;
SET LOCAL ROLE service_role;
DO $test$
DECLARE r record; n int;
BEGIN
 SELECT * INTO r FROM public.get_pipeline_stage_snapshot_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
 IF r.revision<>0 OR jsonb_array_length(r.stages)<>1 THEN RAISE EXCEPTION 'snapshot wrong'; END IF;
 BEGIN
 PERFORM public.replace_pipeline_stages_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,
 '[{"id":"33333333-3333-4333-8333-333333333333","name":"Nova","color":"#123456"}]');
 RAISE EXCEPTION 'deleted referenced stage';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 SELECT count(*) INTO n FROM public.pipeline_stages WHERE organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF n<>1 THEN RAISE EXCEPTION 'non-atomic deletion'; END IF;
 BEGIN
 PERFORM public.replace_pipeline_stages_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,
 '[{"id":"22222222-2222-4222-8222-222222222222","name":"Foreign","color":"#123456"}]');
 RAISE EXCEPTION 'cross-tenant ID allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 SELECT * INTO r FROM public.replace_pipeline_stages_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,
 '[{"id":"11111111-1111-4111-8111-111111111111","name":"Qualificação","color":"#123456"},
 {"id":"33333333-3333-4333-8333-333333333333","name":"Nova","color":"#abcdef"}]');
 IF r.revision<>1 THEN RAISE EXCEPTION 'revision wrong'; END IF;
 -- The legacy English status must block rename, not only Portuguese labels.
 INSERT INTO public.deals(organization_id,stage) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','qualification'),
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333');
 BEGIN
 PERFORM public.replace_pipeline_stages_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,
 '[{"id":"11111111-1111-4111-8111-111111111111","name":"Prospecção","color":"#123456"},
 {"id":"33333333-3333-4333-8333-333333333333","name":"Nova","color":"#abcdef"}]');
 RAISE EXCEPTION 'rename detached legacy qualification deal';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 BEGIN
 PERFORM public.replace_pipeline_stages_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,
 '[{"id":"11111111-1111-4111-8111-111111111111","name":"Qualificação","color":"#123456"}]');
 RAISE EXCEPTION 'delete detached UUID-linked deal';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 SELECT * INTO r FROM public.replace_pipeline_stages_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,
 '[{"id":"11111111-1111-4111-8111-111111111111","name":"Qualificação","color":"#123456"},
 {"id":"33333333-3333-4333-8333-333333333333","name":"Etapa Renomeada","color":"#abcdef"}]');
 IF r.revision<>2 THEN RAISE EXCEPTION 'UUID-linked rename failed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.deals d
 WHERE d.organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
 AND d.stage='33333333-3333-4333-8333-333333333333')
 THEN RAISE EXCEPTION 'Rename changed durable deal reference'; END IF;
 BEGIN
 PERFORM public.replace_pipeline_stages_atomic(
 'cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,
 '[{"id":"11111111-1111-4111-8111-111111111111","name":"Qualificação","color":"#abcdef"}]');
 RAISE EXCEPTION 'stale revision allowed';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 SELECT count(*) INTO n FROM public.pipeline_stages WHERE organization_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 IF n<>2 THEN RAISE EXCEPTION 'stale update changed row count'; END IF;
END;
$test$;
COMMIT;
RESET ROLE;
DO $test$
BEGIN
 IF has_function_privilege('anon','public.replace_pipeline_stages_atomic(uuid,uuid,bigint,jsonb)','EXECUTE')
 OR has_function_privilege('authenticated','public.replace_pipeline_stages_atomic(uuid,uuid,bigint,jsonb)','EXECUTE')
 THEN RAISE EXCEPTION 'public RPC privilege'; END IF;
END;
$test$;
SELECT 'PIPELINE_ATOMIC_PASS';