-- Disposable fixture only, not a substitute for verifying the live CRM schema.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE TABLE public.profiles(id uuid PRIMARY KEY, organization_id uuid NOT NULL,status text NOT NULL);
CREATE TABLE public.accounts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL,
 name text NOT NULL,cnpj text,ie text,segment text,status text NOT NULL,zip text,street text,number text,
 complement text,neighborhood text,city text,state text,tags text[],relationship_type text,
 logo_url text,payment_terms text
);
CREATE TABLE public.account_contacts(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid REFERENCES public.accounts(id),
 organization_id uuid NOT NULL,name text NOT NULL CHECK(name <> 'Fail Contact'),
 email text,mobile_phone text,landline_phone text,role text,is_primary boolean
);
CREATE TABLE public.account_branches(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),account_id uuid REFERENCES public.accounts(id),
 organization_id uuid NOT NULL,name text NOT NULL CHECK(name <> 'Fail Branch'),
 zip text,street text,number text,complement text,neighborhood text,city text,
 state text,cnpj text,ie text,payment_terms text
);
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.profiles TO service_role;
GRANT SELECT,INSERT,UPDATE ON public.accounts TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.account_contacts,public.account_branches TO service_role;
CREATE TABLE public.contact_references (contact_id uuid REFERENCES public.account_contacts(id) ON DELETE RESTRICT);
CREATE TABLE public.branch_references (branch_id uuid REFERENCES public.account_branches(id) ON DELETE RESTRICT);
INSERT INTO public.profiles VALUES
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active');
