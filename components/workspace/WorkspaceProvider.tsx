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
import { readWorkspace, writeWorkspace } from "@/lib/workspace-storage";
import { resolveTaskCompletionFields } from "@/lib/completion-utils";
import { generateId } from "@/lib/id";
import { buildCalendarEvents } from "@/lib/calendar-utils";
import {
  enrichWorkspace,
  type EnrichedProject,
} from "@/lib/workspace-utils";
import type { CompletionMeta } from "@/types/completion";
import type { CalendarEvent, CalendarEventInput, CalendarDisplayEvent } from "@/types/calendar";
import type { Project, ProjectInput } from "@/types/project";
import type { Task, TaskInput } from "@/types/task";
import type { Label, User } from "@/types";
import type { WorkspaceData } from "@/types/workspace";

type WorkspaceContextValue = {
  users: User[];
  labels: Label[];
  projects: EnrichedProject[];
  tasks: Task[];
  events: CalendarEvent[];
  calendarEvents: CalendarDisplayEvent[];
  completionMeta: CompletionMeta;
  isLoaded: boolean;
  createProject: (input: ProjectInput) => Project;
  updateProject: (id: string, input: ProjectInput) => void;
  deleteProject: (id: string) => void;
  createTask: (input: TaskInput) => Task;
  updateTask: (id: string, input: TaskInput) => void;
  updateTaskStatus: (id: string, status: Task["status"]) => void;
  deleteTask: (id: string) => void;
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

/** Fixed date for SSR/pre-hydration calendar deadline calculations. */
const SSR_CALENDAR_REFERENCE = new Date(Date.UTC(2026, 6, 15, 12, 0, 0));

function persist(data: WorkspaceData) {
  writeWorkspace(data);
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { triggerTaskCompletion, triggerProjectCompletion } = useCelebration();
  const storageReady = useStorageHydration();
  const isHydrated = useHydrated();
  const [data, setData] = useState<WorkspaceData>(SEED_WORKSPACE);
  const prevProgressRef = useRef<Map<string, number>>(new Map());
  const progressInitializedRef = useRef(false);
  const workspaceLoadedRef = useRef(false);

  useEffect(() => {
    if (!storageReady || workspaceLoadedRef.current) return;
    workspaceLoadedRef.current = true;
    setData(readWorkspace());
  }, [storageReady]);

  const update = useCallback((updater: (current: WorkspaceData) => WorkspaceData) => {
    setData((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
  }, []);

  const createProject = useCallback(
    (input: ProjectInput): Project => {
      const now = new Date().toISOString();
      const project: Project = {
        id: generateId("proj"),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      update((current) => ({
        ...current,
        projects: [...(current.projects ?? []), project],
      }));
      return project;
    },
    [update]
  );

  const updateProject = useCallback(
    (id: string, input: ProjectInput) => {
      update((current) => ({
        ...current,
        projects: (current.projects ?? []).map((project) =>
          project.id === id
            ? { ...project, ...input, updatedAt: new Date().toISOString() }
            : project
        ),
      }));
    },
    [update]
  );

  const deleteProject = useCallback(
    (id: string) => {
      update((current) => ({
        ...current,
        projects: (current.projects ?? []).filter((p) => p.id !== id),
        tasks: (current.tasks ?? []).filter((t) => t.projectId !== id),
        events: (current.events ?? []).filter((e) => e.projectId !== id),
      }));
    },
    [update]
  );

  const createTask = useCallback(
    (input: TaskInput): Task => {
      const now = new Date().toISOString();
      const task: Task = {
        id: generateId("task"),
        ...input,
        createdAt: now,
        updatedAt: now,
        completedAt: input.status === "completed" ? now : null,
      };

      let celebrationPayload: { taskTitle: string; isFirstEver: boolean } | null =
        null;

      update((current) => {
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

        return {
          ...current,
          completionMeta,
          tasks: [...(current.tasks ?? []), task],
        };
      });

      if (celebrationPayload) {
        triggerTaskCompletion(celebrationPayload);
      }

      return task;
    },
    [triggerTaskCompletion, update]
  );

  const updateTask = useCallback(
    (id: string, input: TaskInput) => {
      let celebrationPayload: { taskTitle: string; isFirstEver: boolean } | null =
        null;

      update((current) => {
        const task = (current.tasks ?? []).find((item) => item.id === id);
        if (!task) return current;

        const now = new Date().toISOString();
        const wasCompleted = task.status === "completed";
        const completionFields = resolveTaskCompletionFields(
          task,
          input.status,
          now
        );
        const isNewlyCompleted =
          input.status === "completed" && !wasCompleted;

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

        return {
          ...current,
          completionMeta,
          tasks: (current.tasks ?? []).map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...input,
                  ...completionFields,
                  updatedAt: now,
                }
              : item
          ),
        };
      });

      if (celebrationPayload) {
        triggerTaskCompletion(celebrationPayload);
      }
    },
    [triggerTaskCompletion, update]
  );

  const updateTaskStatus = useCallback(
    (id: string, status: Task["status"]) => {
      let celebrationPayload: { taskTitle: string; isFirstEver: boolean } | null =
        null;

      update((current) => {
        const task = (current.tasks ?? []).find((item) => item.id === id);
        if (!task) return current;

        const now = new Date().toISOString();
        const wasCompleted = task.status === "completed";
        const completionFields = resolveTaskCompletionFields(task, status, now);
        const isNewlyCompleted = status === "completed" && !wasCompleted;

        let completionMeta = current.completionMeta;
        if (isNewlyCompleted) {
          celebrationPayload = {
            taskTitle: task.title,
            isFirstEver: !completionMeta.hasCelebratedFirstCompletion,
          };
          if (!completionMeta.hasCelebratedFirstCompletion) {
            completionMeta = {
              ...completionMeta,
              hasCelebratedFirstCompletion: true,
            };
          }
        }

        return {
          ...current,
          completionMeta,
          tasks: (current.tasks ?? []).map((item) =>
            item.id === id
              ? { ...item, ...completionFields, updatedAt: now }
              : item
          ),
        };
      });

      if (celebrationPayload) {
        triggerTaskCompletion(celebrationPayload);
      }
    },
    [triggerTaskCompletion, update]
  );

  const deleteTask = useCallback(
    (id: string) => {
      update((current) => ({
        ...current,
        tasks: (current.tasks ?? []).filter((t) => t.id !== id),
      }));
    },
    [update]
  );

  const createEvent = useCallback(
    (input: CalendarEventInput): CalendarEvent => {
      const now = new Date().toISOString();
      const event: CalendarEvent = {
        id: generateId("event"),
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      update((current) => ({
        ...current,
        events: [...(current.events ?? []), event],
      }));
      return event;
    },
    [update]
  );

  const updateEvent = useCallback(
    (id: string, input: CalendarEventInput) => {
      update((current) => ({
        ...current,
        events: (current.events ?? []).map((event) =>
          event.id === id
            ? { ...event, ...input, updatedAt: new Date().toISOString() }
            : event
        ),
      }));
    },
    [update]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      update((current) => ({
        ...current,
        events: (current.events ?? []).filter((e) => e.id !== id),
      }));
    },
    [update]
  );

  const setCompletedSectionExpanded = useCallback(
    (expanded: boolean) => {
      update((current) => ({
        ...current,
        completionMeta: {
          ...current.completionMeta,
          completedSectionExpanded: expanded,
        },
      }));
    },
    [update]
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
      update((current) => ({
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
  }, [data, enriched, triggerProjectCompletion, update]);

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
      isLoaded: storageReady,
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
    storageReady,
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
