# AGENTS.md

Project: **Anovia** — AI-powered project management (Next.js 16, React 19, TypeScript, Tailwind CSS 4, Supabase, Vercel).

---

## Current architecture

Anovia uses the **Next.js App Router** with client-side feature providers and typed domain models. The root layout wraps the app in providers for theme, onboarding, workspace, comments, wellness, Kizuna, and break zone.

**Server vs client:**
- **Server** — route handlers (`app/auth/callback`), session-aware Supabase client via `utils/supabase/server.ts`
- **Client** — interactive UI, providers, forms, and all Supabase reads/writes from the browser via `utils/supabase/client.ts`
- **Proxy** — `proxy.ts` delegates to `utils/supabase/middleware.ts` to refresh auth cookies and gate protected routes on every matched request

**Persistence split:**
| Domain | Storage |
|--------|---------|
| Profiles, projects, tasks | Supabase PostgreSQL |
| Calendar events | Supabase PostgreSQL (`calendar_events`) |
| Direct messages (1:1 chat) | Supabase PostgreSQL (`direct_conversations`, `direct_messages`) |
| In-app notifications | Supabase PostgreSQL (`notifications`) |
| Labels, completion UI state | Browser `localStorage` (`lib/workspace-storage.ts`) |
| Comments, theme, wellness, break zone, Kizuna chat, sidebar, onboarding | Browser `localStorage` |

Do not store profiles, projects, or tasks in `localStorage`.

---

## Supabase authentication

- Email/password sign-up and sign-in at `/app/auth`
- OAuth callback at `/app/auth/callback/route.ts` exchanges email confirmation codes for a session
- `UserMenu` and `ProfilePageContent` load the signed-in user via `onAuthStateChange` and `lib/profile-db.ts`
- `WorkspaceProvider` **must wait for the browser auth session** (`INITIAL_SESSION` / `SIGNED_IN`) before loading workspace data — do not use one-shot `getUser()` without an auth-state subscription
- Use the **shared browser client singleton** in `utils/supabase/client.ts`; avoid creating ad-hoc Supabase clients
- Sign-out: `supabase.auth.signOut()` then redirect to `/auth`
- Required env vars (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Never commit or use the Supabase service-role key in app code

---

## PostgreSQL database

Schema lives in `supabase/schema.sql` and is applied manually in the Supabase SQL Editor.

**Tables:**
| Table | Purpose |
|-------|---------|
| `profiles` | User profile linked 1:1 to `auth.users` |
| `projects` | Workspace projects (`owner_id` → profiles) |
| `tasks` | Tasks within projects (`created_by`, `assignee_id` → profiles) |
| `direct_conversations` | One-to-one DM threads between two profiles (canonical pair order) |
| `direct_messages` | Messages within a direct conversation |
| `notifications` | In-app notifications (assignments, deadlines, DMs) |
| `calendar_events` | User-created calendar events (meetings, focus, wellness) |

**Triggers:**
- `handle_new_user` — inserts a `profiles` row on sign-up from auth metadata
- `set_updated_at` — keeps `updated_at` in sync on row changes

**Data access helpers:**
- `lib/workspace-db.ts` — projects and tasks CRUD; maps DB snake_case ↔ app camelCase
- `lib/profile-db.ts` — profile load, ensure (create if missing), and update
- `lib/calendar-db.ts` — calendar event CRUD; maps DB timestamptz ↔ app date/time fields
- `lib/direct-messages-db.ts` — direct conversation lookup/create and message send/load
- `lib/notifications-db.ts` — notification fetch, deadline sync RPC, mark read
- `lib/workspace-utils.ts` — enrichment (progress, labels display, user lookup)

**Known schema gaps (do not assume these exist in the DB):**
- Project `memberIds` — UI only; DB stores `owner_id` only
- Task `labelIds` — UI only; not persisted to Supabase

---

## Row Level Security (RLS)

RLS is enabled on `profiles`, `projects`, `tasks`, `direct_conversations`, `direct_messages`, `notifications`, and `calendar_events`.

| Table | Policy summary |
|-------|----------------|
| **profiles** | Authenticated users can `SELECT` all profiles. Users can `UPDATE` and `INSERT` only their own row (`id = auth.uid()`). |
| **projects** | Authenticated `SELECT`. `INSERT` requires `owner_id = auth.uid()`. `UPDATE` / `DELETE` restricted to owner. |
| **tasks** | Authenticated `SELECT`. `INSERT` requires `created_by = auth.uid()`. `UPDATE` / `DELETE` allowed for task creator or project owner. |
| **direct_conversations** | `SELECT` / `INSERT` only when `auth.uid()` is one of the two participants; pair stored with `participant_one < participant_two`. |
| **direct_messages** | `SELECT` / `INSERT` only for conversation participants; `sender_id` must equal `auth.uid()` on insert. |
| **notifications** | `SELECT` own rows only. Inserts via SECURITY DEFINER triggers/RPCs; mark-read via RPC. |
| **calendar_events** | `SELECT` creator or project owner (linked events); `INSERT`/`UPDATE`/`DELETE` creator only. |

When adding tables or policies, update `supabase/schema.sql` and document any manual SQL steps for the user.

---

## Folder structure

```
app/                      Routes (pages, layouts, auth callback)
  auth/                   Sign-in / sign-up
  profile/                User profile editor
  projects/ tasks/ ...    Feature pages
components/
  auth/                   AuthForm, UserMenu
  workspace/              WorkspaceProvider (projects + tasks state)
  profile/                Profile UI, UserAvatar
  projects/ tasks/ ...    Feature components
  ui/                     Shared primitives (Button, Input, Card, Modal, …)
  layout/                 MainLayout, Sidebar, TopNavbar
  theme/ wellness/ kizuna/ comments/ …  Feature-scoped UI + providers
lib/                      Business logic, DB helpers, validation, storage
types/                    TypeScript domain types
utils/supabase/           Supabase client, env, middleware helpers
hooks/                    useHydrated, useStorageHydration, etc.
data/                     Seed data, navigation, empty states
supabase/schema.sql       PostgreSQL schema and RLS
proxy.ts                  Next.js 16 proxy (auth session refresh)
```

---

## Development conventions

- **Typed models** — define shapes in `types/`; keep DB mapping in `lib/*-db.ts`
- **Feature providers** — colocate state in `components/<feature>/` providers; expose hooks (`useWorkspace`, `useTheme`, etc.)
- **Shared UI** — reuse `components/ui/`; match existing Tailwind patterns and spacing
- **Hydration safety** — do not read `localStorage` on the first render; use `useHydrated()` or `useStorageHydration()` where needed
- **Validation** — form validation lives in `lib/validation.ts` and feature-specific helpers
- **IDs** — Supabase tables use UUIDs; local-only entities may use `lib/id.ts` generators
- **Minimal diffs** — extend existing helpers and components rather than introducing parallel patterns
- **Comments** — only for non-obvious business logic; prefer self-explanatory code
- **No drive-by changes** — do not refactor unrelated code in the same task

**Scripts:**
```bash
npm run dev      # development server
npm run lint     # ESLint
npm run build    # production build (run before finishing substantive changes)
```

---

## Agent guidance

1. **Auth-first for workspace data** — any code that loads or mutates projects/tasks must assume an authenticated Supabase session. Follow the `WorkspaceProvider` pattern (auth subscription, deduplicated load per user).
2. **Use existing Supabase clients** — import `createClient` from `@/utils/supabase/client` (browser) or `@/utils/supabase/server` (server). Do not duplicate client setup.
3. **Respect the persistence split** — new cross-device data belongs in Supabase with RLS; browser-only preferences may use the existing `localStorage` helpers.
4. **Schema changes** — edit `supabase/schema.sql`; note manual SQL steps for the user. Do not assume migrations run automatically.
5. **Preserve UI patterns** — empty states, loading/error states, MainLayout, RevealOnScroll, and existing form/modal flows.
6. **Profile initials** — display name → email → `"U"` (see `lib/profile-utils.ts`).
7. **Verify work** — run `npm run lint` and `npm run build` after substantive changes unless the task is docs-only.
8. **Git** — do not commit unless explicitly asked; never commit `.env.local` or secrets.

---

## Current limitations (for context)

- Labels, calendar events, comments, theme, wellness, and Kizuna data are not synced via Supabase
- No project members or task labels tables (Team directory reads shared `profiles`; no roles or invitations yet)
- Profile avatars are URL strings only (no upload storage)
- No real-time subscriptions — users must refresh to see others' changes
- Schema is applied manually via the Supabase SQL Editor

Do not describe authentication, Supabase, or shared database persistence as planned future work — they are implemented today.

---

## Future Supabase migrations (roadmap)

The following features remain browser-only today and are candidates for future Supabase tables with RLS:

| Feature | Current storage |
|---------|-----------------|
| Comments | `localStorage` (`lib/comments-storage.ts`) |
| Labels | `localStorage` (`lib/workspace-storage.ts`) |
| Calendar events | `localStorage` (`lib/workspace-storage.ts`) |
| Wellness data | `localStorage` (`lib/wellness-storage.ts`) |
| Kizuna chat & reminders | `localStorage` (Kizuna providers and storage helpers) |

Theme, break zone, sidebar, onboarding, and completion UI state may remain local-only preferences unless cross-device sync is required.
