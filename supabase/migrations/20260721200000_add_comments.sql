-- Project and task comments stored in Supabase.
-- Safe to run once in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects (id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks (id) ON DELETE CASCADE,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'discussion',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT comments_single_target CHECK (
    (
      project_id IS NOT NULL
      AND task_id IS NULL
    )
    OR (
      project_id IS NULL
      AND task_id IS NOT NULL
    )
  ),
  CONSTRAINT comments_body_not_empty CHECK (char_length(trim(body)) > 0),
  CONSTRAINT comments_body_max_length CHECK (char_length(body) <= 2000),
  CONSTRAINT comments_category_check CHECK (
    category IN (
      'discussion',
      'idea',
      'question',
      'blocked',
      'update',
      'review'
    )
  )
);

COMMENT ON TABLE public.comments IS
  'Comments attached to exactly one project or task. Category preserved for existing UI.';

CREATE INDEX IF NOT EXISTS comments_project_id_created_idx
  ON public.comments (project_id, created_at DESC)
  WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS comments_task_id_created_idx
  ON public.comments (task_id, created_at DESC)
  WHERE task_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS comments_author_id_idx
  ON public.comments (author_id);

DROP TRIGGER IF EXISTS comments_set_updated_at ON public.comments;
CREATE TRIGGER comments_set_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_accessible_target" ON public.comments;
CREATE POLICY "comments_select_accessible_target"
  ON public.comments
  FOR SELECT
  TO authenticated
  USING (
    (
      project_id IS NOT NULL
      AND task_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.projects p
        WHERE p.id = comments.project_id
      )
    )
    OR (
      task_id IS NOT NULL
      AND project_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM public.tasks t
        WHERE t.id = comments.task_id
      )
    )
  );

DROP POLICY IF EXISTS "comments_insert_own_on_accessible_target" ON public.comments;
CREATE POLICY "comments_insert_own_on_accessible_target"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (
        project_id IS NOT NULL
        AND task_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.projects p
          WHERE p.id = project_id
        )
      )
      OR (
        task_id IS NOT NULL
        AND project_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.tasks t
          WHERE t.id = task_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
CREATE POLICY "comments_update_own"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND (
      (
        project_id IS NOT NULL
        AND task_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.projects p
          WHERE p.id = comments.project_id
        )
      )
      OR (
        task_id IS NOT NULL
        AND project_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.tasks t
          WHERE t.id = comments.task_id
        )
      )
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    AND (
      (
        project_id IS NOT NULL
        AND task_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.projects p
          WHERE p.id = project_id
        )
      )
      OR (
        task_id IS NOT NULL
        AND project_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.tasks t
          WHERE t.id = task_id
        )
      )
    )
  );

DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid()
    AND (
      (
        project_id IS NOT NULL
        AND task_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.projects p
          WHERE p.id = comments.project_id
        )
      )
      OR (
        task_id IS NOT NULL
        AND project_id IS NULL
        AND EXISTS (
          SELECT 1
          FROM public.tasks t
          WHERE t.id = comments.task_id
        )
      )
    )
  );
