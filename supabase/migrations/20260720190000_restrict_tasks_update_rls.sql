-- Restrict tasks UPDATE RLS to task creator or project owner.
-- Safe to run once in Supabase SQL Editor (Dashboard → SQL → New query).

DROP POLICY IF EXISTS "tasks_update_authenticated" ON public.tasks;

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
