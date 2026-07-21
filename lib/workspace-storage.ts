import { SEED_WORKSPACE, WORKSPACE_STORAGE_KEY } from "@/data/seed-workspace";
import { DEFAULT_COMPLETION_META } from "@/types/completion";
import type { CompletionMeta } from "@/types/completion";
import type { Label } from "@/types/task";

/** Local-only workspace data (not stored in Supabase). */
export type WorkspaceLocalData = {
  labels: Label[];
  completionMeta: CompletionMeta;
};

const DEFAULT_LOCAL_DATA: WorkspaceLocalData = {
  labels: SEED_WORKSPACE.labels,
  completionMeta: DEFAULT_COMPLETION_META,
};

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

function ensureArray<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value : fallback;
}

/** Read labels and completion UI state from localStorage. */
export function readWorkspaceLocal(): WorkspaceLocalData {
  if (typeof window === "undefined") {
    return DEFAULT_LOCAL_DATA;
  }

  try {
    const raw = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    if (!raw) {
      writeWorkspaceLocal(DEFAULT_LOCAL_DATA);
      return DEFAULT_LOCAL_DATA;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      writeWorkspaceLocal(DEFAULT_LOCAL_DATA);
      return DEFAULT_LOCAL_DATA;
    }

    const data = parsed as Partial<WorkspaceLocalData & { events?: unknown }>;

    const normalized: WorkspaceLocalData = {
      labels: ensureArray(data.labels, SEED_WORKSPACE.labels),
      completionMeta: normalizeCompletionMeta(data.completionMeta),
    };

    writeWorkspaceLocal(normalized);
    return normalized;
  } catch {
    writeWorkspaceLocal(DEFAULT_LOCAL_DATA);
    return DEFAULT_LOCAL_DATA;
  }
}

/** Persist local-only workspace data (calendar events are stored in Supabase). */
export function writeWorkspaceLocal(data: WorkspaceLocalData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(data));
}
