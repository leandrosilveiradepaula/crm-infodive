#!/usr/bin/env python3
"""Run the CRM Service Desk migration only against disposable PG16 CI."""
from pathlib import Path
import os
import psycopg
from psycopg.conninfo import conninfo_to_dict
from uuid import UUID

dsn=os.environ.get("CRM_SD_TEST_DSN","")
info=conninfo_to_dict(dsn)
if (os.environ.get("CRM_SD_ISOLATED")!="true"
    or info.get("host") not in ("127.0.0.1","localhost")
    or info.get("dbname")!="crm_sd_module_test"
    or info.get("user")!="crm_ci"):
    raise SystemExit("REFUSING_NON_ISOLATED_CRM_SD_DATABASE")

root=Path(__file__).resolve().parents[1]
migration=(root/"supabase/migrations/20261027123000_service_desk_crm_module.sql").read_text()
A=UUID("11111111-1111-4111-8111-111111111111")
B=UUID("22222222-2222-4222-8222-222222222222")
S=UUID("33333333-3333-4333-8333-333333333333")
O1=UUID("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
O2=UUID("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb")
AC1=UUID("aaaaaaaa-1111-4111-8111-111111111111")
AC2=UUID("bbbbbbbb-2222-4222-8222-222222222222")
CO1=UUID("aaaaaaaa-3333-4333-8333-333333333333")
CO2=UUID("bbbbbbbb-4444-4444-8444-444444444444")

def one(db,sql,*args):
    return db.execute(sql,args).fetchone()[0] if args else db.execute(sql).fetchone()[0]

def fails(db,fn):
    try:
        with db.transaction():
            fn()
    except psycopg.Error:
        pass
    else:
        raise AssertionError("invalid cross-org/role/status mutation accepted")

def as_role(db,role,statement,*args):
    db.execute("SET ROLE "+role)
    try:
        return db.execute(statement,args).fetchone()
    finally:
        db.execute("RESET ROLE")

with psycopg.connect(dsn,autocommit=True) as db:
    db.execute("CREATE ROLE anon NOLOGIN")
    db.execute("CREATE ROLE authenticated NOLOGIN")
    db.execute("CREATE ROLE service_role NOLOGIN BYPASSRLS")
    db.execute("CREATE SCHEMA auth")
    db.execute("""CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS
        $$SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$""")
    db.execute("CREATE SCHEMA crm_internal")
    db.execute("GRANT USAGE ON SCHEMA public,auth,crm_internal TO authenticated, service_role")
    db.execute("GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,service_role")
    db.execute("""CREATE TABLE public.profiles (
        id uuid PRIMARY KEY,organization_id uuid,status text,role text)""")
    db.execute("""CREATE TABLE public.accounts (
        id uuid PRIMARY KEY, organization_id uuid, name text NOT NULL)""")
    db.execute("""CREATE TABLE public.service_contracts (
        id uuid PRIMARY KEY, organization_id uuid, account_id uuid,
        title text)""")
    db.execute("""CREATE FUNCTION crm_internal.current_organization_id() RETURNS uuid
      LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
      SELECT p.organization_id FROM public.profiles p WHERE p.id=(SELECT auth.uid())
      AND p.status='active' AND p.organization_id IS NOT NULL LIMIT 1
      $$""")
    db.execute("GRANT SELECT ON public.profiles TO authenticated,service_role")
    db.execute("GRANT SELECT ON public.accounts,public.service_contracts TO service_role")
    db.execute("GRANT EXECUTE ON FUNCTION crm_internal.current_organization_id() TO authenticated,service_role")
    for uid,org,status,role in [(A,O1,"active","support"),(B,O2,"active","admin"),(S,O1,"inactive","admin")]:
        db.execute("INSERT INTO public.profiles VALUES(%s,%s,%s,%s)",(uid,org,status,role))
    for aid,org in [(AC1,O1),(AC2,O2)]:
        db.execute("INSERT INTO public.accounts VALUES(%s,%s,'Account')",(aid,org))
    for cid,org,aid in [(CO1,O1,AC1),(CO2,O2,AC2)]:
        db.execute("INSERT INTO public.service_contracts VALUES(%s,%s,%s,'Contract')",(cid,org,aid))
    db.execute(migration)

    assert one(db,"SELECT count(*) FROM pg_tables WHERE schemaname='service_desk'")==9
    for role in ["anon","authenticated"]:
        assert not one(db,"SELECT has_schema_privilege(%s,'service_desk','USAGE')",role)
        assert not one(db,"SELECT has_function_privilege(%s,'public.crm_sd_create_ticket_v1(uuid,uuid,uuid,uuid,text,text,text)','EXECUTE')",role)
        assert not one(db,"SELECT has_table_privilege(%s,'service_desk.tickets','SELECT')",role)
    assert one(db,"SELECT count(*) FROM pg_tables WHERE schemaname='public'")==3

    def create(actor=A,org=O1,acc=AC1,con=CO1):
        return as_role(db,"service_role","SELECT public.crm_sd_create_ticket_v1(%s,%s,%s,%s,%s,%s,%s)",
                       actor,org,acc,con,"Backup failure",None,"high")[0]
    result=create()
    assert result["ticket_number"]==1
    ticket=UUID(result["id"])
    assert one(db,"SELECT count(*) FROM service_desk.ticket_events WHERE ticket_id=%s",ticket)==1
    fails(db,lambda:create(A,O1,AC2,CO1))
    fails(db,lambda:create(A,O1,AC1,CO2))
    fails(db,lambda:create(S,O1,AC1,CO1))
    fails(db,lambda:create(A,O2,AC2,CO2))
    fails(db,lambda:create(B,O1,AC1,CO1))
    assert as_role(db,"service_role",
        "SELECT jsonb_array_length(public.crm_sd_list_tickets_v1(%s,%s))",A,O1)[0]==1
    assert as_role(db,"service_role",
        "SELECT jsonb_array_length(public.crm_sd_list_tickets_v1(%s,%s))",B,O2)[0]==0
    assert as_role(db,"service_role",
        "SELECT public.crm_sd_transition_ticket_v1(%s,%s,%s,%s,%s)",
        A,O1,ticket,"new","open")[0]["status"]=="open"
    fails(db,lambda:as_role(db,"service_role",
        "SELECT public.crm_sd_transition_ticket_v1(%s,%s,%s,%s,%s)",
        A,O1,ticket,"new","in_progress"))
    fails(db,lambda:as_role(db,"service_role",
        "SELECT public.crm_sd_transition_ticket_v1(%s,%s,%s,%s,%s)",
        B,O2,ticket,"open","in_progress"))
    # Comments and billable work belong only to the CRM organization.
    def comment(actor=A,org=O1,ticket_id=ticket):
        return as_role(db,"service_role",
            "SELECT public.crm_sd_add_comment_v1(%s,%s,%s,%s,%s)",
            actor,org,ticket_id,"Customer update","internal")[0]
    def time(actor=A,org=O1,ticket_id=ticket,minutes=45):
        return as_role(db,"service_role",
            "SELECT public.crm_sd_record_time_v1(%s,%s,%s,%s,%s)",
            actor,org,ticket_id,minutes,"Remote troubleshooting")[0]
    assert comment()["ticket_id"]==str(ticket)
    assert time()["minutes"]==45
    fails(db,lambda:comment(B,O2,ticket))
    fails(db,lambda:time(B,O2,ticket))
    fails(db,lambda:comment(S,O1,ticket))
    fails(db,lambda:time(S,O1,ticket))
    fails(db,lambda:time(A,O1,ticket,0))
    fails(db,lambda:as_role(db,"service_role",
      "UPDATE service_desk.time_entries SET minutes=20 WHERE ticket_id=%s",ticket))
    assert one(db,"SELECT count(*) FROM service_desk.time_entries WHERE ticket_id=%s",ticket)==1
    assert one(db,"SELECT count(*) FROM service_desk.ticket_comments WHERE ticket_id=%s",ticket)==1
    assert one(db,"SELECT status FROM service_desk.tickets WHERE id=%s",ticket)=="open"
print("CRM_SD_REAL_POSTGRES_MODULE_PASS=1")
