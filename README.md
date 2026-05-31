# Admin Dashboard

A small but production-minded admin dashboard where an authenticated admin can
create typed organizations, invite members by email, and browse the
organizations they manage.

## Live URLs

| Environment | Branch | URL |
| ----------- | ------ | --- |
| **Production** | `main` | https://admin-dashboard-rose-psi-59.vercel.app/ |
| **Preview** | `development` | https://admin-dashboard-git-development-bhatti-brothers-projects.vercel.app/ |

## Seeded test credentials

Use these to sign in to the deployed apps without registering.

**Production** — https://admin-dashboard-rose-psi-59.vercel.app/

```
Email:    bhatti.admin@gmail.com
Password: bhatti12345
```

**Preview (development)** — https://admin-dashboard-git-development-bhatti-brothers-projects.vercel.app/

```
Email:    umer.admin@gmail.com
Password: umer12345
```

## Tech stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** + **SWC** (`@vitejs/plugin-react-swc`)
- **React Router v6** (client-side routing + protected routes)
- **Tailwind CSS v4** + **shadcn/ui** (Radix-based components, Lucide icons)
- **TanStack React Query** (all server state)
- **React Hook Form** + **Zod** (all forms + validation)
- **Supabase** — Postgres, Auth, Edge Functions (Deno), Row Level Security
- **next-themes** (dark mode)
- Deployed on **Vercel**; source on **GitHub**

## Features

- **Authentication** — email/password sign-up & sign-in (Supabase Auth).
  Protected routes redirect unauthenticated users to `/sign-in`; the signed-in
  email and a sign-out control live in the header.
- **Organization creation** — name, type (`School` / `Nonprofit` / `Business`),
  and a **conditional field** (`School district`) shown and required only when
  type = `School`. Validated client-side (Zod) and server-side (DB `CHECK`
  constraint). New orgs appear instantly via React Query invalidation.
- **Organization directory** — every org the admin created, with name, type
  badge, member count and created date. Click a row to open its detail page.
- **Member invitations** — from an org's detail page, invite a member by email.
  The invite runs through a **Supabase Edge Function** that validates input,
  verifies the caller owns the org, and prevents duplicate invites. Members
  appear with an `invited` / `active` status badge.
- **Dark mode**, loading / empty / error states, mobile-tolerable layout.

## Data model & security

```
organizations
  id, name, type (enum), school_district (conditional), created_by → auth.users, created_at
organization_members
  id, organization_id → organizations, user_id → auth.users (nullable),
  email, status (enum), role (enum), invited_at, joined_at
  UNIQUE (organization_id, lower(email))   -- prevents duplicate invites
```

**Row Level Security is enabled on every table.** An admin can only read/write
the organizations they created (`created_by = auth.uid()`) and the members of
those organizations. Cross-tenant access is blocked at the database — verified
with two separate accounts (one admin cannot see or open another's data, even by
direct URL). The invitation Edge Function uses the service-role key (server-side
only) and re-verifies ownership in code.

## Local setup (clone → run in < 15 min)

**Prerequisites:** Node.js 18+ and a free Supabase project.

```bash
# 1. Clone and install
git clone https://github.com/BhattiBrothers/admin-dashboard.git
cd admin-dashboard
npm install

# 2. Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project
# (Dashboard → Connect → App Frameworks, or Project Settings → API Keys)

# 3. Set up the database (see below), then run
npm run dev          # http://localhost:5173
```

### Environment variables

See [`.env.example`](./.env.example). Only the Supabase **URL** and **anon /
publishable key** are needed by the client. They are configured in Vercel (not
committed). The **service-role key is never** in the client or `.env` — it lives
only in the Edge Function (auto-injected by Supabase).

### Recreating the Supabase backend

1. **Schema + RLS** — run the migration against a fresh project:
   `supabase/migrations/20260531120000_initial_schema.sql`
   (paste into the Supabase **SQL Editor**, or `supabase db push`).
2. **Edge Function** — deploy `supabase/functions/invite-function/`
   (Supabase **Edge Functions** → Deploy via editor, or
   `supabase functions deploy invite-function`). Set **Verify JWT: off** for it
   (auth is handled inside the function) so the browser CORS preflight passes.
3. **Auth** — in Authentication → Providers → Email, turn **Confirm email off**
   for easy testing, and create an admin user (Authentication → Users → Add
   user, *Auto Confirm*).

## Branching & workflow

- `main` — production; deploys to the Production URL. Receives merges from
  `development` only at stable milestones.
- `development` — default working branch; deploys to the Preview URL.
- Feature work happens on short-lived branches off `development`
  (`feat/*`, `chore/*`), merged via **pull request**. Commits follow
  Conventional Commits.

Merged PRs: auth, schema & RLS, organizations, invitations, dark mode/polish,
and the production release.

## What I'd do with another day

- **Accept-invitation flow**: invited user clicks a link, signs up, and their
  member row links to their auth account (`user_id`, `status = 'active'`).
- **Real email delivery** from the Edge Function (Resend) — the send seam is
  already marked with a `TODO`.
- **Code-splitting** to shrink the initial bundle, and an **end-to-end test**
  (Playwright) for sign-in → create org → invite.
- Search / filter on the directory and role-based permissions within an org.

## Shortcuts & trade-offs

- Every authenticated user is treated as an admin (the app *is* the admin tool);
  there is no separate non-admin role gate beyond authentication.
- Email confirmation is disabled on the dev project to keep testing friction low;
  the seeded admin is pre-confirmed.
- Invitations create a database record only (no email is sent) — this matches the
  assessment scope, with a clear seam where the send step would plug in.
- The deployed Edge Function slug is `invite-function` (Supabase locks the slug
  at creation time).

## Loom overview

A short walkthrough of the app and the key implementation decisions:
https://www.loom.com/share/016d5ffc2ccf4d2183a99371070033c5
