-- One-to-one direct messages between cohort members.
-- Safe to run once in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Table: direct_conversations
-- Exactly two participants per row; canonical order prevents duplicates.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_conversations (
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

CREATE INDEX IF NOT EXISTS direct_conversations_participant_one_idx
  ON public.direct_conversations (participant_one);

CREATE INDEX IF NOT EXISTS direct_conversations_participant_two_idx
  ON public.direct_conversations (participant_two);

DROP TRIGGER IF EXISTS direct_conversations_set_updated_at ON public.direct_conversations;
CREATE TRIGGER direct_conversations_set_updated_at
  BEFORE UPDATE ON public.direct_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Table: direct_messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.direct_messages (
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

CREATE INDEX IF NOT EXISTS direct_messages_conversation_created_idx
  ON public.direct_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.direct_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "direct_conversations_select_participant" ON public.direct_conversations;
CREATE POLICY "direct_conversations_select_participant"
  ON public.direct_conversations
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_one
    OR auth.uid() = participant_two
  );

DROP POLICY IF EXISTS "direct_conversations_insert_participant" ON public.direct_conversations;
CREATE POLICY "direct_conversations_insert_participant"
  ON public.direct_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (participant_one, participant_two)
    AND participant_one < participant_two
    AND participant_one <> participant_two
  );

DROP POLICY IF EXISTS "direct_messages_select_participant" ON public.direct_messages;
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

DROP POLICY IF EXISTS "direct_messages_insert_self_participant" ON public.direct_messages;
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
