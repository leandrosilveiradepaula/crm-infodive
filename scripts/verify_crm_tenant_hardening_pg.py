#!/usr/bin/env python3
"""Real PostgreSQL 16 integration tests for the CRM P0 migration.

Refuses anything except a specifically named local, throwaway CI database.
No production Supabase, model, browser, network API, or customer rows used.
"""
from __future__ import annotations

import os
from pathlib import Path
from uuid import UUID
import psycopg
from psycopg.conninfo import conninfo_to_dict

dsn=os.environ.get("CRM_RLS_ISOLATED_TEST_DSN","")
info=conninfo_to_dict(dsn)
if (os.environ.get("CRM_RLS_ISOLATED_TEST")!="true"
    or info.get("host") not in ("127.0.0.1","localhost")
    or info.get("dbname")!="crm_rls_test"
    or info.get("user")!="crm_ci"):
    raise SystemExit("REFUSING_NON_ISOLATED_CRM_DATABASE")

root=Path(__file__).resolve().parents[1]
migration=(root/"supabase/migrations/20261026204500_crm_authoritative_tenant_rls.sql").read_text()
assert migration.lstrip().startswith("-- P0:")
assert migration.rstrip().endswith("COMMIT;")

tenant_tables=[
    "account_branches","account_contacts","accounts","activities",
    "ai_activity_suggestions","api_keys","app_settings","audit_logs",
    "automations","contact_blacklists","contact_suggestions","contracts",
    "customer_assets","deal_activities","deal_products","deal_quotes",
    "deal_rooms","deals","documents","integrations","invitations","leads",
    "pipeline_stages","products","proposals","sales_order_installments",
    "sales_order_items","sales_orders","service_contracts","webhooks",
]
non_tenant_tables=[
    "automation_logs","campaigns","gamification_badges","omnichannel_conversations",
    "omnichannel_messages","organization_settings","profiles","project_handovers",
    "proposal_signatures","proposal_versions","purchase_orders","scenarios",
    "user_badges","user_scores",
]
assert len(set(tenant_tables+non_tenant_tables))==44
rls_legacy_off={"account_branches","accounts","activities","automation_logs",
                "deals","products","profiles","proposal_versions"}

A=UUID("11111111-1111-4111-8111-111111111111")
B=UUID("22222222-2222-4222-8222-222222222222")
C=UUID("33333333-3333-4333-8333-333333333333")
ORG_A=UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
ORG_B=UUID("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
obj_a=UUID("aaaaaaaa-1111-4111-8111-111111111111")
obj_b=UUID("bbbbbbbb-2222-4222-8222-222222222222")

def one(db,statement,*args):
    # An empty psycopg parameter list would parse SQL LIKE '%user_metadata%'
    # as a placeholder. Execute literal SQL without a params argument.
    return (db.execute(statement,args) if args else db.execute(statement)).fetchone()[0]

def execute_as(db,role,uid,statement,*args):
    db.execute("RESET ROLE")
    db.execute("SELECT set_config('request.jwt.claim.sub',%s,false)",(str(uid) if uid else "",))
    db.execute("SELECT set_config('request.jwt.claims',%s,false)",
        ('{"role":"authenticated","user_metadata":{"organization_id":"%s"}}'%ORG_B,))
    db.execute("SET ROLE "+role)
    try:
        return (db.execute(statement,args) if args else db.execute(statement)).fetchall()
    finally:
        db.execute("RESET ROLE")

with psycopg.connect(dsn,autocommit=True) as db:
    db.execute("CREATE ROLE anon NOLOGIN")
    db.execute("CREATE ROLE authenticated NOLOGIN")
    db.execute("CREATE ROLE service_role NOLOGIN BYPASSRLS")
    db.execute("CREATE SCHEMA auth")
    db.execute("""
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE
      AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE
      AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    """)
    db.execute("GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role")
    db.execute("GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role")

    db.execute("""CREATE TABLE public.profiles (
      id uuid primary key, organization_id uuid, status text, role text,
      full_name text,avatar_url text,phone text,theme_preference text,
      dashboard_config jsonb,updated_at timestamptz
    )""")
    for t in tenant_tables:
        db.execute(f"CREATE TABLE public.{t} (id uuid primary key, organization_id uuid)")
    definitions={
        "automation_logs":"id uuid primary key, automation_id uuid, status text",
        "campaigns":"id uuid primary key, active boolean",
        "gamification_badges":"id text primary key",
        "proposal_versions":"id uuid primary key,proposal_id uuid",
        "user_badges":"id uuid primary key,user_id uuid",
        "user_scores":"user_id uuid primary key",
        "scenarios":"id uuid primary key,user_id uuid",
        "proposal_signatures":"id uuid primary key,proposal_id uuid",
    }
    for t in non_tenant_tables:
        if t=="profiles":continue
        db.execute(f"CREATE TABLE public.{t} ({definitions.get(t,'id uuid primary key')})")
    for t in tenant_tables+non_tenant_tables:
        if t not in rls_legacy_off:
            db.execute(f"ALTER TABLE public.{t} ENABLE ROW LEVEL SECURITY")
    db.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon,authenticated,service_role")

    for t in ["accounts","deals","activities","proposals","sales_orders"]:
        db.execute(f"""CREATE POLICY "Tenant Isolation" ON public.{t} FOR ALL TO authenticated
          USING (organization_id = (auth.jwt()->'user_metadata'->>'organization_id')::uuid)
          WITH CHECK (organization_id = (auth.jwt()->'user_metadata'->>'organization_id')::uuid)""")
    db.execute("""CREATE POLICY "Profiles Public Access" ON public.profiles FOR ALL
      USING(true) WITH CHECK(true)""")
    db.execute("""CREATE POLICY "Public view with token" ON public.proposals FOR SELECT
      TO anon,authenticated USING(true)""")
    db.execute("""CREATE POLICY "Allow all operations for authenticated users" ON
      public.deal_products FOR ALL TO authenticated USING(true) WITH CHECK(true)""")
    db.execute("""CREATE POLICY "Manage Campaigns" ON public.campaigns
      FOR ALL USING(true) WITH CHECK(true)""")
    db.execute("""CREATE POLICY "Read Active Campaigns" ON public.campaigns
      FOR SELECT USING(true)""")
    db.execute("""CREATE POLICY "Read access for authenticated" ON public.user_badges
      FOR SELECT TO authenticated USING(true)""")
    db.execute("""CREATE POLICY "Read access for authenticated" ON public.user_scores
      FOR SELECT TO authenticated USING(true)""")

    for user,org,status in [(A,ORG_A,"active"),(B,ORG_B,"active"),(C,ORG_A,"inactive")]:
        db.execute("INSERT INTO public.profiles (id,organization_id,status,role) VALUES (%s,%s,%s,'vendedor')",
                   (user,org,status))
    for row_id,org in ((obj_a,ORG_A),(obj_b,ORG_B)):
        for t in ("accounts","deals","proposals","automations"):
            db.execute(f"INSERT INTO public.{t}(id,organization_id) VALUES(%s,%s)",(row_id,org))
    db.execute("INSERT INTO public.proposal_versions(id,proposal_id) VALUES(%s,%s)",
               (UUID("aaaaaaaa-1111-4111-8111-222222222222"),obj_a))
    db.execute("INSERT INTO public.proposal_versions(id,proposal_id) VALUES(%s,%s)",
               (UUID("bbbbbbbb-2222-4222-8222-333333333333"),obj_b))
    db.execute("INSERT INTO public.automation_logs(id,automation_id,status) VALUES(%s,%s,'success')",
               (UUID("aaaaaaaa-1111-4111-8111-444444444444"),obj_a))
    db.execute("INSERT INTO public.automation_logs(id,automation_id,status) VALUES(%s,%s,'success')",
               (UUID("bbbbbbbb-2222-4222-8222-555555555555"),obj_b))

    db.execute(migration)

    assert one(db,"SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
           "WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity")==0
    assert one(db,"SELECT count(*) FROM pg_policies WHERE schemaname='public' AND "
           "(coalesce(qual,'') ilike '%user_metadata%' OR coalesce(with_check,'') ilike '%user_metadata%')")==0
    assert one(db,"SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
           "WHERE n.nspname='public' AND c.relkind='r' AND has_table_privilege('anon',c.oid,'SELECT')")==0

    # Forging user_metadata for tenant B does not change user A's authority.
    assert execute_as(db,"authenticated",A,"SELECT id FROM public.accounts")==[(obj_a,)]
    assert execute_as(db,"authenticated",B,"SELECT id FROM public.accounts")==[(obj_b,)]
    assert execute_as(db,"authenticated",C,"SELECT id FROM public.accounts")==[]
    assert execute_as(db,"authenticated",A,"SELECT id FROM public.deals")==[(obj_a,)]
    assert execute_as(db,"authenticated",A,"SELECT id FROM public.proposals")==[(obj_a,)]
    assert len(execute_as(db,"authenticated",A,"SELECT id FROM public.proposal_versions"))==1
    assert len(execute_as(db,"authenticated",A,"SELECT id FROM public.automation_logs"))==1
    assert execute_as(db,"authenticated",A,"SELECT public.get_jwt_org_id()")==[(ORG_A,)]
    assert execute_as(db,"authenticated",C,"SELECT public.get_jwt_org_id()")==[(None,)]

    for role,uid,sql,expected in (
        ("anon",None,"SELECT id FROM public.accounts","42501"),
        ("authenticated",A,"UPDATE public.profiles SET role='admin' WHERE id='%s'"%A,"42501"),
        ("authenticated",A,"UPDATE public.profiles SET organization_id='%s' WHERE id='%s'"%(ORG_B,A),"42501"),
        ("authenticated",A,"INSERT INTO public.accounts(id,organization_id) VALUES('%s','%s')"%
         (UUID("eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"),ORG_B),"42501"),
    ):
        try:
            execute_as(db,role,uid,sql)
        except psycopg.Error as exc:
            assert exc.sqlstate==expected,(sql,exc.sqlstate,exc)
        else:
            raise AssertionError("Unauthorized SQL was allowed: "+sql)

    # Service-role reads remain available for the app's server-side clients.
    assert len(execute_as(db,"service_role",None,"SELECT id FROM public.accounts"))==2
    assert len(execute_as(db,"service_role",None,"SELECT id FROM public.profiles"))==3

    # Confirm an authenticated user cannot read or write the public proposal
    # table anonymously even though the historical policy was USING(TRUE).
    assert one(db,"SELECT count(*) FROM pg_policies WHERE schemaname='public' "
        "AND tablename='proposals' AND policyname='Public view with token'")==0
    assert one(db,"SELECT count(*) FROM pg_policies WHERE schemaname='public' "
        "AND tablename='profiles' AND policyname='Profiles Public Access'")==0

print("CRM_AUTHORITATIVE_TENANT_RLS_PG16_PASS=1")
