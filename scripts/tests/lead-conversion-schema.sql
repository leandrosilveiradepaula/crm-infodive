-- Minimal disposable PostgreSQL schema for transaction contract tests.
-- NOT the real CRM schema. Real schema review is mandatory before production.
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY, organization_id uuid NOT NULL, status text NOT NULL
);
CREATE TABLE public.leads (
  id uuid PRIMARY KEY, organization_id uuid NOT NULL,
  company text NOT NULL, contact_name text NOT NULL, email text, phone text,
  status text NOT NULL DEFAULT 'Novo', interest text, cnpj text, ie text,
  zip text, street text, number text, complement text,
  neighborhood text, city text, state text
);
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
  name text NOT NULL, cnpj text, ie text, zip text, street text, number text,
  complement text, neighborhood text, city text, state text,
  industry text, status text NOT NULL
);
CREATE TABLE public.account_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  name text NOT NULL CHECK (name <> 'Falha Contato'),
  email text, mobile_phone text, role text, is_primary boolean
);
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
  account_id uuid NOT NULL REFERENCES public.accounts(id),
  title text NOT NULL CHECK (title <> 'Oportunidade: Falha Negocio'),
  status text, value numeric, probability integer,
  close_date timestamptz, owner_id uuid
);
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.profiles TO service_role;
GRANT SELECT, UPDATE ON public.leads TO service_role;
GRANT SELECT, INSERT ON public.accounts, public.account_contacts, public.deals TO service_role;
INSERT INTO public.profiles VALUES
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','active'),
  ('dddddddd-dddd-4ddd-8ddd-dddddddddddd','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','inactive');
INSERT INTO public.leads (id,organization_id,company,contact_name,status,interest)
VALUES
('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Acme','Ana','Novo','Software'),
('11111111-1111-4111-8111-111111111112','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Falha','Contato','Novo','Software'),
('11111111-1111-4111-8111-111111111113','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Falha','Deal','Novo','Software'),
('11111111-1111-4111-8111-111111111114','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Outro','Outro','Novo','Software'),
('11111111-1111-4111-8111-111111111115','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Concorrencia','Ana','Novo','Software');
