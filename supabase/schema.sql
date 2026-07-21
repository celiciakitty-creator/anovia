-- =============================================================================
-- Anovia — Supabase database schema
-- =============================================================================
-- Run this file manually in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Do NOT commit service-role keys. The app uses the publishable (anon) key only.
--
-- Order of operations in this file:
--   1. Helper functions (updated_at, profile bootstrap)
--   2. Tables + constraints + indexes
--   3. Triggers
--   4. Row Level Security policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at in sync on row changes
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at IS
  'Sets updated_at to now() before INSERT/UPDATE on Anovia tables.';

-- ---------------------------------------------------------------------------
-- Table: profiles
-- One row per auth.users record. Created automatically on sign-up.
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  display_name text,
  github_handle text,
  avatar_url text,
  leaderboard_opt_in boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Public user profile linked 1:1 with auth.users. Populated from sign-up metadata.';

COMMENT ON COLUMN public.profiles.id IS 'Matches auth.users.id.';
COMMENT ON COLUMN public.profiles.email IS 'Copy of auth email for convenient joins and display.';
COMMENT ON COLUMN public.profiles.display_name IS 'Friendly name from sign-up metadata (display_name).';
COMMENT ON COLUMN public.profiles.github_handle IS 'GitHub username from sign-up metadata (github_handle).';
COMMENT ON COLUMN public.profiles.leaderboard_opt_in IS
  'When true, the member appears on the opt-in Team Leaderboard.';

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: projects
-- Workspace projects. owner_id is the creating user (maps to app owner).
-- ---------------------------------------------------------------------------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  status text NOT NULL,
  due_date date,
  owner_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT projects_status_check CHECK (
    status IN ('active', 'paused', 'completed', 'archived')
  )
);

COMMENT ON TABLE public.projects IS
  'Projects in Anovia. Aligns with app ProjectStatus: active, paused, completed, archived.';

COMMENT ON COLUMN public.projects.owner_id IS
  'User who owns the project; used for update/delete RLS.';

CREATE INDEX projects_owner_id_idx ON public.projects (owner_id);

CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: tasks
-- Tasks belong to a project. created_by supports secure delete policies.
-- ---------------------------------------------------------------------------
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  project_id uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  due_date date,
  priority text NOT NULL,
  status text NOT NULL,
  estimated_minutes integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT tasks_priority_check CHECK (
    priority IN ('low', 'medium', 'high')
  ),
  CONSTRAINT tasks_status_check CHECK (
    status IN ('todo', 'in_progress', 'stuck', 'review', 'completed')
  ),
  CONSTRAINT tasks_estimated_minutes_check CHECK (
    estimated_minutes >= 0
  )
);

COMMENT ON TABLE public.tasks IS
  'Tasks within projects. Status/priority values match the Anovia TypeScript types.';

COMMENT ON COLUMN public.tasks.created_by IS
  'User who created the task; used with project owner for DELETE RLS.';
COMMENT ON COLUMN public.tasks.assignee_id IS
  'Optional assignee profile. Any authenticated user may update assignment per app policy.';
COMMENT ON COLUMN public.tasks.completed_at IS
  'Timestamp when status became completed; null while task is open.';

CREATE INDEX tasks_project_id_idx ON public.tasks (project_id);
CREATE INDEX tasks_assignee_id_idx ON public.tasks (assignee_id);
CREATE INDEX tasks_status_idx ON public.tasks (status);

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: auto-create profile when a new auth user signs up
-- Reads display_name and github_handle from raw_user_meta_data.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, github_handle)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'display_name', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'github_handle', '')), '')
  );
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Inserts a profiles row after auth.users sign-up using email and user metadata.';

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
  'Bootstraps public.profiles from Supabase Auth sign-up metadata.';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- ---- profiles policies ----

-- Any signed-in user can read profiles (team directory, assignee display).
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "profiles_select_authenticated" ON public.profiles IS
  'Authenticated users can read all profiles.';

-- Users may update their own profile row (display name, GitHub handle, avatar).
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

COMMENT ON POLICY "profiles_update_own" ON public.profiles IS
  'Users can update only their own profile.';

-- Users may insert their own profile row when the sign-up trigger did not run.
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

COMMENT ON POLICY "profiles_insert_own" ON public.profiles IS
  'Users can create their own profile row if missing (id must match auth.uid()).';

-- Profile INSERT is also handled by handle_new_user trigger (SECURITY DEFINER).

-- ---- projects policies ----

CREATE POLICY "projects_select_authenticated"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "projects_select_authenticated" ON public.projects IS
  'Authenticated users can read all projects.';

CREATE POLICY "projects_insert_authenticated"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

COMMENT ON POLICY "projects_insert_authenticated" ON public.projects IS
  'Authenticated users can create projects; owner_id must be the current user.';

CREATE POLICY "projects_update_owner"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

COMMENT ON POLICY "projects_update_owner" ON public.projects IS
  'Only the project owner can update their project.';

CREATE POLICY "projects_delete_owner"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

COMMENT ON POLICY "projects_delete_owner" ON public.projects IS
  'Only the project owner can delete their project (cascades to tasks).';

-- ---- tasks policies ----

CREATE POLICY "tasks_select_authenticated"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY "tasks_select_authenticated" ON public.tasks IS
  'Authenticated users can read all tasks.';

CREATE POLICY "tasks_insert_authenticated"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

COMMENT ON POLICY "tasks_insert_authenticated" ON public.tasks IS
  'Authenticated users can create tasks; created_by must be the current user.';

-- Task creator or project owner may update tasks (status, assignee, and other fields).
CREATE POLICY "tasks_update_creator_or_project_owner"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.owner_id = auth.uid()
    )
  );

COMMENT ON POLICY "tasks_update_creator_or_project_owner" ON public.tasks IS
  'Task creator or owning project owner may update a task.';

CREATE POLICY "tasks_delete_creator_or_project_owner"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.projects p
      WHERE p.id = tasks.project_id
        AND p.owner_id = auth.uid()
    )
  );

COMMENT ON POLICY "tasks_delete_creator_or_project_owner" ON public.tasks IS
  'Task creator or owning project owner may delete a task.';

-- ---------------------------------------------------------------------------
-- Table: direct_conversations
-- Private one-to-one chats. participant_one < participant_two prevents duplicates.
-- ---------------------------------------------------------------------------
CREATE TABLE public.direct_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  participant_two uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT direct_conversations_participant_order CHECK (
    participant_one < participant_two
  ),
  CONSTRAINT direct_conversations_distinct_participants CHECK (
    participant_one <> participant_two
  ),
  CONSTRAINT direct_conversations_unique_pair UNIQUE (
    participant_one,
    participant_two
  )
);

COMMENT ON TABLE public.direct_conversations IS
  'Private one-to-one conversations between two profile IDs.';

CREATE INDEX direct_conversations_participant_one_idx
  ON public.direct_conversations (participant_one);

CREATE INDEX direct_conversations_participant_two_idx
  ON public.direct_conversations (participant_two);

CREATE TRIGGER direct_conversations_set_updated_at
  BEFORE UPDATE ON public.direct_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: direct_messages
-- ---------------------------------------------------------------------------
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.direct_conversations (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT direct_messages_body_not_empty CHECK (
    char_length(trim(body)) > 0
  ),
  CONSTRAINT direct_messages_body_max_length CHECK (
    char_length(body) <= 2000
  )
);

COMMENT ON TABLE public.direct_messages IS
  'Messages within a direct conversation. Sender must be a participant.';

CREATE INDEX direct_messages_conversation_created_idx
  ON public.direct_messages (conversation_id, created_at);

ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "direct_conversations_select_participant"
  ON public.direct_conversations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_one
    OR auth.uid() = participant_two
  );

COMMENT ON POLICY "direct_conversations_select_participant" ON public.direct_conversations IS
  'Only the two participants can read a conversation row.';

CREATE POLICY "direct_conversations_insert_participant"
  ON public.direct_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (participant_one, participant_two)
    AND participant_one < participant_two
    AND participant_one <> participant_two
  );

COMMENT ON POLICY "direct_conversations_insert_participant" ON public.direct_conversations IS
  'Authenticated users may create a conversation only when they are one of the two participants.';

CREATE POLICY "direct_messages_select_participant"
  ON public.direct_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.direct_conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant_one, c.participant_two)
    )
  );

COMMENT ON POLICY "direct_messages_select_participant" ON public.direct_messages IS
  'Only conversation participants can read messages.';

CREATE POLICY "direct_messages_insert_self_participant"
  ON public.direct_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.direct_conversations c
      WHERE c.id = conversation_id
        AND auth.uid() IN (c.participant_one, c.participant_two)
    )
  );

COMMENT ON POLICY "direct_messages_insert_self_participant" ON public.direct_messages IS
  'Users may send messages only as themselves and only in conversations they belong to.';

-- =============================================================================
-- End of schema
-- =============================================================================
