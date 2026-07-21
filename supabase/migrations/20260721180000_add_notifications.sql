-- Supabase-backed in-app notifications for Anovia.
-- Safe to run once in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Table: notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  dedup_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,

  CONSTRAINT notifications_type_check CHECK (
    type IN (
      'task_assigned',
      'task_deadline_approaching',
      'task_overdue',
      'direct_message_received'
    )
  ),
  CONSTRAINT notifications_title_not_empty CHECK (char_length(trim(title)) > 0),
  CONSTRAINT notifications_message_not_empty CHECK (char_length(trim(message)) > 0)
);

COMMENT ON TABLE public.notifications IS
  'In-app notifications for authenticated users. Inserts are server-side only.';

CREATE INDEX IF NOT EXISTS notifications_recipient_created_idx
  ON public.notifications (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_unread_idx
  ON public.notifications (recipient_id)
  WHERE is_read = false;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_recipient_dedup_key_idx
  ON public.notifications (recipient_id, dedup_key)
  WHERE dedup_key IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Helper: create notification (SECURITY DEFINER — not callable for arbitrary recipients from client logic bypass)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_notification(
  p_recipient_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_link text DEFAULT NULL,
  p_dedup_key text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_dedup_key IS NOT NULL THEN
    INSERT INTO public.notifications (
      recipient_id,
      type,
      title,
      message,
      link,
      dedup_key
    )
    VALUES (
      p_recipient_id,
      p_type,
      p_title,
      p_message,
      p_link,
      p_dedup_key
    )
    ON CONFLICT (recipient_id, dedup_key) DO NOTHING
    RETURNING id INTO v_id;

    RETURN v_id;
  END IF;

  INSERT INTO public.notifications (
    recipient_id,
    type,
    title,
    message,
    link
  )
  VALUES (
    p_recipient_id,
    p_type,
    p_title,
    p_message,
    p_link
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.create_notification IS
  'Internal helper for triggers/RPCs to insert notifications. Supports dedup via dedup_key.';

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text, text) FROM PUBLIC;

-- ---------------------------------------------------------------------------
-- Trigger: direct message received
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_direct_message_received()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_participant_one uuid;
  v_participant_two uuid;
  v_recipient_id uuid;
  v_preview text;
BEGIN
  SELECT c.participant_one, c.participant_two
  INTO v_participant_one, v_participant_two
  FROM public.direct_conversations c
  WHERE c.id = NEW.conversation_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF NEW.sender_id = v_participant_one THEN
    v_recipient_id := v_participant_two;
  ELSE
    v_recipient_id := v_participant_one;
  END IF;

  v_preview := left(trim(NEW.body), 120);
  IF char_length(trim(NEW.body)) > 120 THEN
    v_preview := v_preview || '…';
  END IF;

  PERFORM public.create_notification(
    v_recipient_id,
    'direct_message_received',
    'New direct message',
    v_preview,
    '/messages/' || NEW.sender_id::text,
    NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS direct_messages_notify_recipient ON public.direct_messages;
CREATE TRIGGER direct_messages_notify_recipient
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_direct_message_received();

-- ---------------------------------------------------------------------------
-- Trigger: task assigned
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.notify_task_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.assignee_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.assignee_id IS NOT DISTINCT FROM NEW.assignee_id THEN
    RETURN NEW;
  END IF;

  PERFORM public.create_notification(
    NEW.assignee_id,
    'task_assigned',
    'Task assigned to you',
    format('"%s" was assigned to you.', NEW.title),
    '/tasks?focus=' || NEW.id::text,
    NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_notify_assignee ON public.tasks;
CREATE TRIGGER tasks_notify_assignee
  AFTER INSERT OR UPDATE OF assignee_id ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_task_assigned();

-- ---------------------------------------------------------------------------
-- RPC: sync approaching/overdue deadline notifications for the signed-in user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_deadline_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_created integer := 0;
  r record;
  v_inserted uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  FOR r IN
    SELECT t.id, t.title, t.due_date
    FROM public.tasks t
    WHERE t.assignee_id = v_user_id
      AND t.status <> 'completed'
      AND t.due_date IS NOT NULL
  LOOP
    IF r.due_date < current_date THEN
      SELECT public.create_notification(
        v_user_id,
        'task_overdue',
        'Task overdue',
        format('"%s" is past its due date.', r.title),
        '/tasks?focus=' || r.id::text,
        'task_overdue:' || r.id::text
      ) INTO v_inserted;

      IF v_inserted IS NOT NULL THEN
        v_created := v_created + 1;
      END IF;
    ELSIF r.due_date <= current_date + 2 THEN
      SELECT public.create_notification(
        v_user_id,
        'task_deadline_approaching',
        'Deadline approaching',
        format('"%s" is due on %s.', r.title, to_char(r.due_date, 'Mon DD')),
        '/tasks?focus=' || r.id::text,
        'task_deadline:' || r.id::text || ':' || r.due_date::text
      ) INTO v_inserted;

      IF v_inserted IS NOT NULL THEN
        v_created := v_created + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_created;
END;
$$;

COMMENT ON FUNCTION public.sync_deadline_notifications IS
  'Creates deduplicated deadline/overdue notifications for the current user assigned open tasks.';

GRANT EXECUTE ON FUNCTION public.sync_deadline_notifications() TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: mark notifications read
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE id = p_notification_id
    AND recipient_id = auth.uid()
    AND is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.notifications
  SET
    is_read = true,
    read_at = COALESCE(read_at, now())
  WHERE recipient_id = auth.uid()
    AND is_read = false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies for authenticated clients.
-- Notifications are created by SECURITY DEFINER triggers/RPCs only.
