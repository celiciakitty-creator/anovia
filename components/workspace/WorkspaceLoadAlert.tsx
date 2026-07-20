"use client";

import { useWorkspace } from "./WorkspaceProvider";

/** Surfaces workspace load failures across authenticated pages. */
export function WorkspaceLoadAlert() {
  const { loadError, isLoaded } = useWorkspace();

  if (!isLoaded || !loadError) return null;

  return (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
    >
      {loadError}
    </div>
  );
}
