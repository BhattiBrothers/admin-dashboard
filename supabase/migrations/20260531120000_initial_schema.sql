-- =====================================================================
-- Admin Dashboard — initial schema, constraints, and Row Level Security
-- =====================================================================
-- Run this against a fresh Supabase project (SQL Editor or `supabase db push`).
-- Every table has RLS enabled so an admin can only read/write their OWN
-- organizations and the members of those organizations.

-- ---------------------------------------------------------------------
-- Enums (organization type drives a conditional field in the UI)
-- ---------------------------------------------------------------------
create type organization_type as enum ('school', 'nonprofit', 'business');
create type member_status     as enum ('invited', 'active');
create type member_role       as enum ('admin', 'member');

-- ---------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------
create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(trim(name)) > 0),
  type            organization_type not null,
  -- Type-specific field: only meaningful (and required) when type = 'school'.
  school_district text,
  created_by      uuid not null references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),

  -- Enforce the conditional field server-side: a school must have a district,
  -- and non-schools must not carry one.
  constraint organizations_school_district_check check (
    (type = 'school'  and school_district is not null and char_length(trim(school_district)) > 0)
    or
    (type <> 'school' and school_district is null)
  )
);

create index organizations_created_by_idx on public.organizations (created_by);

-- ---------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------
create table public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- Null until the invited person accepts and links their auth account.
  user_id         uuid references auth.users (id) on delete set null,
  email           text not null check (position('@' in email) > 1),
  status          member_status not null default 'invited',
  role            member_role   not null default 'member',
  invited_at      timestamptz not null default now(),
  joined_at       timestamptz
);

create index organization_members_organization_id_idx
  on public.organization_members (organization_id);

-- Prevent duplicate invitations to the same email within the same org
-- (case-insensitive).
create unique index organization_members_org_email_unique_idx
  on public.organization_members (organization_id, lower(email));

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.organizations        enable row level security;
alter table public.organization_members enable row level security;

-- ---- organizations: an admin only sees/edits the orgs they created ----
create policy "organizations_select_own"
  on public.organizations for select
  using (created_by = auth.uid());

create policy "organizations_insert_own"
  on public.organizations for insert
  with check (created_by = auth.uid());

create policy "organizations_update_own"
  on public.organizations for update
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "organizations_delete_own"
  on public.organizations for delete
  using (created_by = auth.uid());

-- ---- organization_members: scoped to orgs the caller owns ----
-- (The invite Edge Function uses the service-role key, which bypasses RLS,
--  but still verifies ownership in code. These policies guard direct client
--  access so an admin can never touch another tenant's members.)
create policy "members_select_for_owned_orgs"
  on public.organization_members for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.created_by = auth.uid()
    )
  );

create policy "members_insert_for_owned_orgs"
  on public.organization_members for insert
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.created_by = auth.uid()
    )
  );

create policy "members_update_for_owned_orgs"
  on public.organization_members for update
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.created_by = auth.uid()
    )
  );

create policy "members_delete_for_owned_orgs"
  on public.organization_members for delete
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_members.organization_id
        and o.created_by = auth.uid()
    )
  );
