import { SEED_WORKSPACE, WORKSPACE_STORAGE_KEY } from "@/data/seed-workspace";
import { DEFAULT_COMPLETION_META } from "@/types/completion";
import type { Task } from "@/types/task";
import type { CompletionMeta } from "@/types/completion";
import type { WorkspaceData } from "@/types/workspace";

function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

function isWorkspaceData(value: unknown): value is Partial<WorkspaceData> {
  if (!value || typeof value !== "object") return false;
  const data = value as Partial<WorkspaceData>;
  return (
    Array.isArray(data.users) &&
    Array.isArray(data.projects) &&
    Array.isArray(data.tasks) &&
    Array.isArray(data.labels)
  );
}

function normalizeTask(task: Task): Task {
  const status = task.status ?? "todo";
  const completedAt =
    status === "completed"
      ? task.completedAt ?? task.updatedAt ?? task.createdAt ?? null
      : null;

  return { ...task, completedAt };
}

function normalizeCompletionMeta(
  meta: Partial<CompletionMeta> | undefined
): CompletionMeta {
  if (!meta) return DEFAULT_COMPLETION_META;

  return {
    hasCelebratedFirstCompletion: Boolean(meta.hasCelebratedFirstCompletion),
    celebratedProjectIds: Array.isArray(meta.celebratedProjectIds)
      ? meta.celebratedProjectIds
      : [],
    completedSectionExpanded: Boolean(meta.completedSectionExpanded),
  };
}

function normalizeWorkspace(data: Partial<WorkspaceData>): WorkspaceData {
  const tasks = ensureArray(data.tasks, SEED_WORKSPACE.tasks).map((task) =>
    normalizeTask(task as Task)
  );

  return {
    users: ensureArray(data.users, SEED_WORKSPACE.users),
    projects: ensureArray(data.projects, SEED_WORKSPACE.projects),
    tasks,
    labels: ensureArray(data.labels, SEED_WORKSPACE.labels),
    events: ensureArray(data.events, SEED_WORKSPACE.events),
    completionMeta: normalizeCompletionMeta(data.completionMeta),
  };
}

function workspaceNeedsRepair(data: Partial<WorkspaceData>): boolean {
  const tasksNeedRepair = ensureArray(data.tasks, []).some(
    (task) => !("completedAt" in (task as Task))
  );

  return (
    !Array.isArray(data.users) ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.tasks) ||
    !Array.isArray(data.labels) ||
    !Array.isArray(data.events) ||
    !data.completionMeta ||
    tasksNeedRepair
  );
}

/** Read workspace from localStorage, falling back to seed data. */
export function readWorkspace(): WorkspaceData {
  if (typeof window === "undefined") {
    return SEED_WORKSPACE;
  }

  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      writeWorkspace(SEED_WORKSPACE);
      return SEED_WORKSPACE;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isWorkspaceData(parsed)) {
      writeWorkspace(SEED_WORKSPACE);
      return SEED_WORKSPACE;
    }

    const normalized = normalizeWorkspace(parsed);
    if (workspaceNeedsRepair(parsed)) {
      writeWorkspace(normalized);
    }
    return normalized;
  } catch {
    writeWorkspace(SEED_WORKSPACE);
    return SEED_WORKSPACE;
  }
}

/** Persist workspace to localStorage. */
export function writeWorkspace(data: WorkspaceData): void {
  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(data));
}
