# Anovia

AI-powered project management platform focused on productivity, motivation, and healthy work habits.

## Live Demo

https://anovia.vercel.app

## Features

- **Dashboard** — workspace overview, activity, and progress widgets
- **Projects** — create, edit, and track projects with team context
- **Tasks** — Kanban board with filtering and status updates
- **Calendar** — events linked to projects
- **Team** — directory of workspace members from Supabase profiles
- **Profile** — edit display name, GitHub handle, and avatar URL
- **Wellness Hub** — wellness tracking and reminders
- **Break Zone** — guided break activities
- **Growth Garden** — gamified progress visualization
- **Kizuna AI** — in-app assistant and reminders
- **Themes** — light, dark, system, and custom color presets
- **Comments** — threaded discussions on projects and tasks

## Tech Stack

- **Next.js 16** — App Router, server and client components
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — Auth, PostgreSQL, and Row Level Security (RLS)
- **Vercel** — deployment

## Installation

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/celiciakitty-creator/anovia.git
cd anovia
npm install
```

### 2. Environment variables

Copy the example file and fill in your Supabase project credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |

Find both values in the Supabase dashboard under **Project Settings → API**.

### 3. Database setup

Run the schema in the Supabase SQL Editor:

```
supabase/schema.sql
```

This creates `profiles`, `projects`, and `tasks` tables, RLS policies, and a sign-up trigger that bootstraps user profiles.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or sign in at `/auth` to access the app.

## Architecture

```
app/                    Next.js App Router pages and layouts
components/             Feature UI, shared components, providers
lib/                    Data helpers, validation, utilities
types/                  Typed domain models
utils/supabase/         Supabase client setup
  client.ts             Shared browser client (singleton)
  server.ts             Server Component / Route Handler client
  middleware.ts         Session refresh and route protection
proxy.ts                Next.js 16 proxy entry (auth gate)
supabase/schema.sql     PostgreSQL schema and RLS policies
```

### Authentication

- Email/password sign-up and sign-in via **Supabase Auth**
- Session cookies refreshed on each request through the root proxy
- Protected routes redirect unauthenticated users to `/auth`
- User profiles stored in `public.profiles`, linked to `auth.users`

### Data persistence

| Data | Storage |
|------|---------|
| Projects, tasks, profiles | Supabase PostgreSQL |
| Labels, calendar events, completion UI state | Browser `localStorage` |
| Comments, theme, wellness, break zone, Kizuna chat | Browser `localStorage` |

Projects and tasks are loaded through `WorkspaceProvider`, which waits for the Supabase auth session before fetching. CRUD operations go through typed helpers in `lib/workspace-db.ts` and `lib/profile-db.ts`.

### Row Level Security

RLS is enabled on all application tables. Policies enforce:

- **Profiles** — any authenticated user can read; users can update (and insert, if missing) only their own row
- **Projects** — authenticated read; create requires `owner_id = auth.uid()`; update/delete restricted to the owner
- **Tasks** — authenticated read and update; create requires `created_by = auth.uid()`; delete allowed for the creator or project owner

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Current Limitations

- **Partial localStorage usage** — labels, calendar events, comments, theme preferences, wellness data, and Kizuna chat history remain in the browser and are not synced across devices
- **No project member table** — project `memberIds` in the UI map to the owner only; multi-member assignment is not persisted
- **No task labels in the database** — label selections on tasks are not saved to Supabase
- **Avatar via URL only** — profile avatars accept a URL string; there is no file upload storage
- **Manual schema deployment** — database migrations are applied by running `supabase/schema.sql` in the Supabase SQL Editor
- **No real-time collaboration** — changes from other users require a page refresh to appear

## License

Private — all rights reserved.
