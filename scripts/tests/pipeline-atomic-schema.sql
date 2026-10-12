CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE TABLE public.profiles(id uuid PRIMARY KEY,organization_id uuid NOT NULL,status text);
CREATE TABLE public.pipeline_stages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL,name text NOT NULL,color text,order_index integer);
CREATE TABLE public.deals(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL,stage text);
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.profiles,public.deals TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.pipeline_stages TO service_role;
INSERT INTO public.profiles VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active');
INSERT INTO public.pipeline_stages VALUES
('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Qualificação','#abcdef',0),
('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Outro','#123456',0);
INSERT INTO public.deals(organization_id,stage)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Qualificação');