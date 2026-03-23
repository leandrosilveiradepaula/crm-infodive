create table if not exists "public"."scenarios" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "name" text not null,
    "fixed_costs" jsonb not null default '[]'::jsonb,
    "variable_costs" jsonb not null default '[]'::jsonb,
    "desired_margin" numeric not null default 0,
    "headcount" integer not null default 0,
    "staff" jsonb not null default '[]'::jsonb,
    "quarterly_percentages" jsonb not null default '{"q1": 25, "q2": 25, "q3": 25, "q4": 25}'::jsonb,
    "payroll_tax" numeric default 70,
    "revenue_goal" numeric,
    "input_goal_value" numeric,
    "goal_mode" text default 'revenue',
    "created_at" timestamp with time zone not null default now(),

    constraint "scenarios_pkey" primary key ("id")
);

alter table "public"."scenarios" enable row level security;

drop policy if exists "Users can view their own scenarios" on "public"."scenarios";
create policy "Users can view their own scenarios"
on "public"."scenarios"
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own scenarios" on "public"."scenarios";
create policy "Users can insert their own scenarios"
on "public"."scenarios"
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own scenarios" on "public"."scenarios";
create policy "Users can update their own scenarios"
on "public"."scenarios"
for update
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can delete their own scenarios" on "public"."scenarios";
create policy "Users can delete their own scenarios"
on "public"."scenarios"
for delete
to authenticated
using (auth.uid() = user_id);
