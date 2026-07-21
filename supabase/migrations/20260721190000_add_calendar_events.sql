-- Calendar events stored in Supabase (replaces localStorage).
-- Safe to run once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  creator_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  event_type text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT calendar_events_event_type_check CHECK (
    event_type IN ('meeting', 'focus_session', 'wellness_reminder')
  ),
  CONSTRAINT calendar_events_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT calendar_events_end_after_start CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.calendar_events IS
  'User-created calendar events. Virtual task/project deadlines remain derived in the app.';

CREATE INDEX IF NOT EXISTS calendar_events_creator_id_idx
  ON public.calendar_events (creator_id);

CREATE INDEX IF NOT EXISTS calendar_events_project_id_idx
  ON public.calendar_events (project_id);

CREATE INDEX IF NOT EXISTS calendar_events_start_date_idx
  ON public.calendar_events (start_date);

DROP TRIGGER IF EXISTS calendar_events_set_updated_at ON public.calendar_events;
CREATE TRIGGER calendar_events_set_updated_at
  BEFORE UPDATE ON public.calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events_select_visible" ON public.calendar_events;
CREATE POLICY "calendar_events_select_visible"
  ON public.calendar_events
  FOR SELECT
  TO authenticated
  USING (
    creator_id = auth.uid()
    OR (
      project_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = calendar_events.project_id
          AND p.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "calendar_events_insert_own" ON public.calendar_events;
CREATE POLICY "calendar_events_insert_own"
  ON public.calendar_events
  FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "calendar_events_update_own" ON public.calendar_events;
CREATE POLICY "calendar_events_update_own"
  ON public.calendar_events
  FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

DROP POLICY IF EXISTS "calendar_events_delete_own" ON public.calendar_events;
CREATE POLICY "calendar_events_delete_own"
  ON public.calendar_events
  FOR DELETE
  TO authenticated
  USING (creator_id = auth.uid());
