"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCelebration } from "@/components/celebration";
import { SEED_WORKSPACE } from "@/data/seed-workspace";
import { useHydrated } from "@/hooks/useHydrated";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import { buildCalendarEvents } from "@/lib/calendar-utils";
import {
  createProject as createProjectDb,
  createTask as createTaskDb,
  deleteProject as deleteProjectDb,
  deleteTask as deleteTaskDb,
  getAuthenticatedUserId,
  getProfiles,
  getProjects,
  getTasks,
  updateProject as updateProjectDb,
  updateTask as updateTaskDb,
  updateTaskStatus as updateTaskStatusDb,
} from "@/lib/workspace-db";
import {
  readWorkspaceLocal,
  writeWorkspaceLocal,
} from "@/lib/workspace-storage";
import {
  enrichWorkspace,
  type EnrichedProject,
} from "@/lib/workspace-utils";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_COMPLETION_META } from "@/types/completion";
import type { CompletionMeta } from "@/types/completion";
import type { CalendarEvent, CalendarEventInput, CalendarDisplayEvent } from "@/types/calendar";
import type { Project, ProjectInput } from "@/types/project";
import type { Task, TaskInput } from "@/types/task";
import type { Label, User } from "@/types";
import type { WorkspaceData } from "@/types/workspace";
import { generateId } from "@/lib/id";

type WorkspaceContextValue = {
  users: User[];
  labels: Label[];
  projects: EnrichedProject[];
  tasks: Task[];
  events: CalendarEvent[];
  calendarEvents: CalendarDisplayEvent[];
  completionMeta: CompletionMeta;
  currentUserId: string | null;
  isLoaded: boolean;
  loadError: string | null;
  createProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (id: string, input: ProjectInput) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (input: TaskInput) => Promise<Task>;
  updateTask: (id: string, input: TaskInput) => Promise<void>;
  updateTaskStatus: (id: string, status: Task["status"]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createEvent: (input: CalendarEventInput) => CalendarEvent;
  updateEvent: (id: string, input: CalendarEventInput) => void;
  deleteEvent: (id: string) => void;
  setCompletedSectionExpanded: (expanded: boolean) => void;
  getProject: (id: string) => EnrichedProject | undefined;
  getTask: (id: string) => Task | undefined;
  getEvent: (id: string) => CalendarEvent | undefined;
  raw: WorkspaceData;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

const SSR_CALENDAR_REFERENCE = new Date(Date.UTC(2026, 6, 15, 12, 0, 0));

const EMPTY_WORKSPACE: WorkspaceData = {
  users: [],
  projects: [],
  tasks: [],
  labels: SEED_WORKSPACE.labels,
  events: [],
  completionMeta: DEFAULT_COMPLETION_META,
};

function persistLocalSlice(data: WorkspaceData) {
  writeWorkspaceLocal({
    labels: data.labels,
    events: data.events,
    completionMeta: data.completionMeta,
  });
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { triggerTaskCompletion, triggerProjectCompletion } = useCelebration();
  const storageReady = useStorageHydration();
  const isHydrated = useHydrated();
  const [data, setData] = useState<WorkspaceData>(EMPTY_WORKSPACE);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const prevProgressRef = useRef<Map<string, number>>(new Map());
  const progressInitializedRef = useRef(false);
  const workspaceLoadedRef = useRef(false);

  useEffect(() => {
    if (!storageReady || workspaceLoadedRef.current) return;
    workspaceLoadedRef.current = true;

    void (async () => {
      const local = readWorkspaceLocal();
      setData((current) => ({
        ...current,
        labels: local.labels,
        events: local.events,
        completionMeta: local.completionMeta,
      }));

      try {
        const supabase = createClient();
        const userId = await getAuthenticatedUserId(supabase);
        const [projects, tasks, users] = await Promise.all([
          getProjects(supabase),
          getTasks(supabase),
          getProfiles(supabase),
        ]);

        setCurrentUserId(userId);
        setData((current) => ({
          ...current,
          users,
          projects,
          tasks,
        }));
        setLoadError(null);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load workspace data.";
        setLoadError(message);
      } finally {
        setIsLoaded(true);
      }
    })();
  }, [storageReady]);

  const updateLocal = useCallback(
    (updater: (current: WorkspaceData) => WorkspaceData) => {
      setData((current) => {
        const next = updater(current);
        persistLocalSlice(next);
        return next;
      });
    },
    []
  );

  const createProject = useCallback(
    async (input: ProjectInput): Promise<Project> => {
      const supabase = createClient();
      const ownerId = currentUserId ?? (await getAuthenticatedUserId(supabase));
      const project = await createProjectDb(supabase, input, ownerId);
      setData((current) => ({
        ...current,
        projects: [project, ...(current.projects ?? [])],
      }));
      return project;
    },
    [currentUserId]
  );

  const updateProject = useCallback(
    async (id: string, input: ProjectInput): Promise<void> => {
      const supabase = createClient();
      const project = await updateProjectDb(supabase, id, input);
      setData((current) => ({
        ...current,
        projects: (current.projects ?? []).map((item) =>
          item.id === id ? project : item
        ),
      }));
    },
    []
  );

  const deleteProject = useCallback(async (id: string): Promise<void> => {
    const supabase = createClient();
    await deleteProjectDb(supabase, id);
    setData((current) => ({
      ...current,
      projects: (current.projects ?? []).filter((project) => project.id !== id),
      tasks: (current.tasks ?? []).filter((task) => task.projectId !== id),
      events: (current.events ?? []).filter((event) => event.projectId !== id),
    }));
  }, []);

  const createTask = useCallback(
    async (input: TaskInput): Promise<Task> => {
      const supabase = createClient();
      const createdBy =
        currentUserId ?? (await getAuthenticatedUserId(supabase));
      const task = await createTaskDb(supabase, input, createdBy);

      let celebrationPayload: { taskTitle: string; isFirstEver: boolean } | null =
        null;

      setData((current) => {
        let completionMeta = current.completionMeta;
        if (input.status === "completed") {
          celebrationPayload = {
            taskTitle: input.title,
            isFirstEver: !completionMeta.hasCelebratedFirstCompletion,
          };
          if (!completionMeta.hasCelebratedFirstCompletion) {
            completionMeta = {
              ...completionMeta,
              hasCelebratedFirstCompletion: true,
            };
          }
        }

        const next = {
          ...current,
          completionMeta,
          tasks: [task, ...(current.tasks ?? [])],
        };
        persistLocalSlice(next);
        return next;
      });

      if (celebrationPayload) {
        triggerTaskCompletion(celebrationPayload);
      }

      return task;
    },
    [currentUserId, triggerTaskCompletion]
  );

  const updateTask = useCallback(
    async (id: string, input: TaskInput): Promise<void> => {
      const supabase = createClient();
      const existing = data.tasks.find((task) => task.id === id);
      if (!existing) return;

      let celebrationPayload: { taskTitle: string; isFirstEver: boolean } | null =
        null;

      const task = await updateTaskDb(supabase, id, input, existing);
      const wasCompleted = existing.status === "completed";
      const isNewlyCompleted = input.status === "completed" && !wasCompleted;

      setData((current) => {
        let completionMeta = current.completionMeta;
        if (isNewlyCompleted) {
          celebrationPayload = {
            taskTitle: input.title,
            isFirstEver: !completionMeta.hasCelebratedFirstCompletion,
          };
          if (!completionMeta.hasCelebratedFirstCompletion) {
            completionMeta = {
              ...completionMeta,
              hasCelebratedFirstCompletion: true,
            };
          }
        }

        const next = {
          ...current,
          completionMeta,
          tasks: (current.tasks ?? []).map((item) =>
            item.id === id ? task : item
          ),
        };
        persistLocalSlice(next);
        return next;
      });

      if (celebrationPayload) {
        triggerTaskCompletion(celebrationPayload);
      }
    },
    [data.tasks, triggerTaskCompletion]
  );

  const updateTaskStatus = useCallback(
    async (id: string, status: Task["status"]): Promise<void> => {
      const supabase = createClient();
      const existing = data.tasks.find((task) => task.id === id);
      if (!existing) return;

      let celebrationPayload: { taskTitle: string; isFirstEver: boolean } | null =
        null;

      const task = await updateTaskStatusDb(supabase, id, status, existing);
      const wasCompleted = existing.status === "completed";
      const isNewlyCompleted = status === "completed" && !wasCompleted;

      setData((current) => {
        let completionMeta = current.completionMeta;
        if (isNewlyCompleted) {
          celebrationPayload = {
            taskTitle: existing.title,
            isFirstEver: !completionMeta.hasCelebratedFirstCompletion,
          };
          if (!completionMeta.hasCelebratedFirstCompletion) {
            completionMeta = {
              ...completionMeta,
              hasCelebratedFirstCompletion: true,
            };
          }
        }

        const next = {
          ...current,
          completionMeta,
          tasks: (current.tasks ?? []).map((item) =>
            item.id === id ? task : item
          ),
        };
        persistLocalSlice(next);
        return next;
      });

      if (celebrationPayload) {
        triggerTaskCompletion(celebrationPayload);
      }
    },
    [data.tasks, triggerTaskCompletion]
  );

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    const supabase = createClient();
    await deleteTaskDb(supabase, id);
    setData((current) => ({
      ...current,
      tasks: (current.tasks ?? []).filter((task) => task.id !== id),
    }));
  }, []);

  const createEvent = useCallback(
    (input: CalendarEventInput): CalendarEvent => {
      const now = new Date().toISOString();
      const event: CalendarEvent = {
        id: generateId("event"),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      updateLocal((current) => ({
        ...current,
        events: [...(current.events ?? []), event],
      }));
      return event;
    },
    [updateLocal]
  );

  const updateEvent = useCallback(
    (id: string, input: CalendarEventInput) => {
      updateLocal((current) => ({
        ...current,
        events: (current.events ?? []).map((event) =>
          event.id === id
            ? { ...event, ...input, updatedAt: new Date().toISOString() }
            : event
        ),
      }));
    },
    [updateLocal]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      updateLocal((current) => ({
        ...current,
        events: (current.events ?? []).filter((event) => event.id !== id),
      }));
    },
    [updateLocal]
  );

  const setCompletedSectionExpanded = useCallback(
    (expanded: boolean) => {
      updateLocal((current) => ({
        ...current,
        completionMeta: {
          ...current.completionMeta,
          completedSectionExpanded: expanded,
        },
      }));
    },
    [updateLocal]
  );

  const enriched = useMemo(() => enrichWorkspace(data), [data]);

  useEffect(() => {
    const celebratedIds = data.completionMeta.celebratedProjectIds;
    const newlyComplete: EnrichedProject[] = [];

    for (const project of enriched.projects) {
      const previousProgress = progressInitializedRef.current
        ? (prevProgressRef.current.get(project.id) ?? project.progress)
        : project.progress;

      prevProgressRef.current.set(project.id, project.progress);

      if (
        previousProgress < 100 &&
        project.progress === 100 &&
        project.taskCount > 0 &&
        !celebratedIds.includes(project.id)
      ) {
        newlyComplete.push(project);
      }
    }

    progressInitializedRef.current = true;

    if (newlyComplete.length === 0) return;

    for (const project of newlyComplete) {
      triggerProjectCompletion({ projectName: project.name });
    }

    const projectIds = newlyComplete.map((project) => project.id);
    window.setTimeout(() => {
      updateLocal((current) => ({
        ...current,
        completionMeta: {
          ...current.completionMeta,
          celebratedProjectIds: [
            ...current.completionMeta.celebratedProjectIds,
            ...projectIds.filter(
              (id) => !current.completionMeta.celebratedProjectIds.includes(id)
            ),
          ],
        },
      }));
    }, 0);
  }, [data, enriched, triggerProjectCompletion, updateLocal]);

  const calendarEvents = useMemo(() => {
    try {
      const reference = isHydrated ? new Date() : SSR_CALENDAR_REFERENCE;
      return buildCalendarEvents(data, reference);
    } catch {
      return [];
    }
  }, [data, isHydrated]);

  const value = useMemo<WorkspaceContextValue>(() => {
    return {
      users: data.users,
      labels: data.labels,
      projects: enriched.projects ?? [],
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      events: Array.isArray(data.events) ? data.events : [],
      calendarEvents: calendarEvents ?? [],
      completionMeta: data.completionMeta,
      currentUserId,
      isLoaded,
      loadError,
      createProject,
      updateProject,
      deleteProject,
      createTask,
      updateTask,
      updateTaskStatus,
      deleteTask,
      createEvent,
      updateEvent,
      deleteEvent,
      setCompletedSectionExpanded,
      getProject: (id) => (enriched.projects ?? []).find((p) => p.id === id),
      getTask: (id) => (Array.isArray(data.tasks) ? data.tasks : []).find((t) => t.id === id),
      getEvent: (id) => (Array.isArray(data.events) ? data.events : []).find((e) => e.id === id),
      raw: data,
    };
  }, [
    data,
    enriched,
    calendarEvents,
    currentUserId,
    isLoaded,
    loadError,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    createEvent,
    updateEvent,
    deleteEvent,
    setCompletedSectionExpanded,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
