import { getTaskCompletionTimestamp } from "@/lib/completion-utils";
import { getKizunaFocusMusicMessage } from "@/lib/focus-music-utils";
import { getTodayDateString } from "@/lib/wellness-storage";
import type { KizunaReminder } from "@/types/kizuna-reminder";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { WellnessData } from "@/types/wellness";
import type { WorkspaceData } from "@/types/workspace";
import {
  calculateProjectProgress,
  getProjectById,
  getProjectTasks,
} from "@/lib/workspace-utils";
import { HYDRATION_GOAL } from "@/types/wellness";

const INACTIVE_PROJECT_DAYS = 7;
const LONG_FOCUS_MINUTES = 45;
const MILESTONE_WINDOW_HOURS = 48;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(dateStr: string): Date {
  return startOfDay(new Date(dateStr));
}

function hoursSince(iso: string, reference = new Date()): number {
  return (reference.getTime() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function getOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status !== "completed");
}

function getProjectLastActivity(tasks: Task[], projectId: string): Date | null {
  const projectTasks = getProjectTasks(tasks, projectId);
  if (projectTasks.length === 0) return null;

  const latest = projectTasks.reduce((max, task) => {
    const updated = new Date(task.updatedAt).getTime();
    return updated > max ? updated : max;
  }, 0);

  return new Date(latest);
}

function buildDeadlineSoonReminders(
  tasks: Task[],
  projects: Project[],
  reference: Date
): KizunaReminder[] {
  const now = reference.getTime();
  const in24Hours = now + 24 * 60 * 60 * 1000;

  return getOpenTasks(tasks)
    .filter((task) => {
      const due = parseDate(task.dueDate).getTime();
      return due >= startOfDay(reference).getTime() && due <= in24Hours;
    })
    .map((task) => {
      const project = getProjectById(projects, task.projectId);
      const dueToday = parseDate(task.dueDate).getTime() === startOfDay(reference).getTime();
      return {
        id: `deadline-soon:${task.id}:${task.dueDate}`,
        category: "deadline_soon" as const,
        priority: "helpful" as const,
        title: dueToday ? "Due today" : "Due within 24 hours",
        message: `"${task.title}" on ${project?.name ?? "your project"} is coming up soon — even a small step forward could feel great.`,
        href: "/tasks",
        entityId: task.id,
        createdAt: reference.toISOString(),
        toastEligible: true,
      };
    });
}

function buildOverdueReminders(
  tasks: Task[],
  projects: Project[],
  reference: Date
): KizunaReminder[] {
  const today = startOfDay(reference).getTime();

  return getOpenTasks(tasks)
    .filter((task) => parseDate(task.dueDate).getTime() < today)
    .map((task) => {
      const project = getProjectById(projects, task.projectId);
      return {
        id: `overdue:${task.id}:${task.status}`,
        category: "overdue" as const,
        priority: "gentle" as const,
        title: "Ready when you are",
        message: `Whenever it fits your day, "${task.title}" on ${project?.name ?? "a project"} could use a little love — no pressure, just a friendly nudge.`,
        href: "/tasks",
        entityId: task.id,
        createdAt: reference.toISOString(),
        toastEligible: false,
      };
    });
}

function buildProjectBehindReminders(
  tasks: Task[],
  projects: Project[],
  reference: Date
): KizunaReminder[] {
  const reminders: KizunaReminder[] = [];

  for (const project of projects) {
    if (project.status !== "active") continue;

    const progress = calculateProjectProgress(tasks, project.id);
    const projectTasks = getProjectTasks(tasks, project.id);
    if (projectTasks.length === 0) continue;

    const due = parseDate(project.dueDate);
    const daysUntilDue = Math.ceil(
      (due.getTime() - startOfDay(reference).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue > 14 || daysUntilDue < 0) continue;
    if (progress >= 50) continue;

    reminders.push({
      id: `project-behind:${project.id}:${progress}`,
      category: "project_behind",
      priority: "gentle",
      title: "Room to grow",
      message: `"${project.name}" is at ${progress}% with a little time left — one small win today could feel really satisfying.`,
      href: "/projects",
      entityId: project.id,
      createdAt: reference.toISOString(),
      toastEligible: false,
    });
  }

  return reminders;
}

function buildInactiveProjectReminders(
  tasks: Task[],
  projects: Project[],
  reference: Date
): KizunaReminder[] {
  const reminders: KizunaReminder[] = [];

  for (const project of projects) {
    if (project.status !== "active") continue;

    const lastActivity = getProjectLastActivity(tasks, project.id);
    if (!lastActivity) continue;

    const daysSinceActivity = Math.floor(
      (reference.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceActivity < INACTIVE_PROJECT_DAYS) continue;

    reminders.push({
      id: `project-inactive:${project.id}:${daysSinceActivity}`,
      category: "project_inactive",
      priority: "gentle",
      title: "Quiet project",
      message: `"${project.name}" has been resting for a bit — a quick check-in when you're ready might spark some nice momentum.`,
      href: "/projects",
      entityId: project.id,
      createdAt: reference.toISOString(),
      toastEligible: false,
    });
  }

  return reminders;
}

function buildMilestoneReminders(
  tasks: Task[],
  projects: Project[],
  reference: Date
): KizunaReminder[] {
  const reminders: KizunaReminder[] = [];

  for (const task of tasks) {
    if (task.status !== "completed") continue;

    const completedAt = getTaskCompletionTimestamp(task);
    if (!completedAt) continue;
    if (hoursSince(completedAt, reference) > MILESTONE_WINDOW_HOURS) continue;

    const project = getProjectById(projects, task.projectId);
    reminders.push({
      id: `milestone:task:${task.id}:${completedAt.slice(0, 10)}`,
      category: "milestone",
      priority: "celebration",
      title: "Nice work!",
      message: `You finished "${task.title}" on ${project?.name ?? "a project"} — that's a lovely milestone worth appreciating.`,
      href: "/tasks",
      entityId: task.id,
      createdAt: reference.toISOString(),
      toastEligible: true,
    });
  }

  for (const project of projects) {
    if (project.status !== "active") continue;

    const progress = calculateProjectProgress(tasks, project.id);
    const milestones = [25, 50, 75, 100];
    const hit = milestones.find(
      (milestone) => progress >= milestone && progress < milestone + 5
    );

    if (!hit || hit === 100) continue;

    reminders.push({
      id: `milestone:project:${project.id}:${hit}`,
      category: "milestone",
      priority: "celebration",
      title: `${hit}% milestone`,
      message: `"${project.name}" reached ${hit}% — you're building something meaningful, one step at a time.`,
      href: "/projects",
      entityId: project.id,
      createdAt: reference.toISOString(),
      toastEligible: true,
    });
  }

  return reminders;
}

function buildFocusSessionReminders(
  wellness: WellnessData,
  reference: Date
): KizunaReminder[] {
  const reminders: KizunaReminder[] = [];
  const today = getTodayDateString(reference);
  const { focusTimer } = wellness;

  if (focusTimer.activeSessionStartedAt) {
    const elapsedMinutes =
      (reference.getTime() - new Date(focusTimer.activeSessionStartedAt).getTime()) /
      (1000 * 60);

    if (elapsedMinutes >= LONG_FOCUS_MINUTES) {
      reminders.push({
        id: `focus-long:active:${today}`,
        category: "focus_session",
        priority: "gentle",
        title: "Deep focus mode",
        message:
          "You've been in a wonderful flow — a cozy stretch or sip of water could help you keep that energy going.",
        href: "/wellness",
        createdAt: reference.toISOString(),
        toastEligible: true,
      });
    }
  }

  if (
    focusTimer.lastSessionDate === today &&
    focusTimer.sessionsCompletedToday >= 2
  ) {
    reminders.push({
      id: `focus-sessions:${today}:${focusTimer.sessionsCompletedToday}`,
      category: "focus_session",
      priority: "gentle",
      title: "Great focus today",
      message:
        "You've completed multiple focus sessions — that's impressive! A gentle break might feel really refreshing right now.",
      href: "/wellness",
      createdAt: reference.toISOString(),
      toastEligible: false,
    });
  }

  const focusMusicMessage = getKizunaFocusMusicMessage(
    wellness.focusMusic.preferredSound
  );
  if (focusMusicMessage && wellness.focusMusic.preferredSound) {
    reminders.push({
      id: `focus-music:${wellness.focusMusic.preferredSound}:${today}`,
      category: "focus_session",
      priority: "gentle",
      title: "Focus sound ready",
      message: focusMusicMessage,
      href: "/wellness",
      createdAt: reference.toISOString(),
      toastEligible: false,
    });
  }

  return reminders;
}

function buildWellnessReminders(
  wellness: WellnessData,
  reference: Date
): KizunaReminder[] {
  const reminders: KizunaReminder[] = [];
  const today = getTodayDateString(reference);

  if (wellness.checkIn.date !== today) {
    reminders.push({
      id: `wellness:checkin:${today}`,
      category: "wellness",
      priority: "gentle",
      title: "How are you feeling?",
      message:
        "A quick wellness check-in takes just a moment — Kizuna would love to know how your day is going.",
      href: "/wellness",
      createdAt: reference.toISOString(),
      toastEligible: true,
    });
  }

  const hydrationCount =
    wellness.hydration.date === today ? wellness.hydration.count : 0;

  if (hydrationCount < HYDRATION_GOAL) {
    reminders.push({
      id: `wellness:hydration:${today}:${hydrationCount}`,
      category: "wellness",
      priority: "gentle",
      title: "Hydration buddy",
      message: `You're at ${hydrationCount} of ${HYDRATION_GOAL} glasses today — a little water break could feel lovely whenever you're ready.`,
      href: "/wellness",
      createdAt: reference.toISOString(),
      toastEligible: false,
    });
  }

  const enabledWellnessReminders = (
    Object.entries(wellness.reminders) as [
      keyof typeof wellness.reminders,
      { enabled: boolean },
    ][]
  ).filter(([, pref]) => pref.enabled);

  if (enabledWellnessReminders.length > 0) {
    reminders.push({
      id: `wellness:reminders-on:${today}`,
      category: "wellness",
      priority: "gentle",
      title: "Wellness reminders on",
      message:
        "Your wellness reminders are active — Kizuna will gently nudge you to stretch, rest your eyes, and hydrate throughout the day.",
      href: "/wellness",
      createdAt: reference.toISOString(),
      toastEligible: false,
    });
  }

  return reminders;
}

const PRIORITY_ORDER: Record<KizunaReminder["priority"], number> = {
  helpful: 0,
  gentle: 1,
  celebration: 2,
};

/** Generate all Kizuna reminders from workspace and wellness state. */
export function generateKizunaReminders(
  workspace: WorkspaceData,
  wellness: WellnessData,
  reference = new Date()
): KizunaReminder[] {
  const { projects, tasks } = workspace;

  const reminders = [
    ...buildDeadlineSoonReminders(tasks, projects, reference),
    ...buildOverdueReminders(tasks, projects, reference),
    ...buildProjectBehindReminders(tasks, projects, reference),
    ...buildInactiveProjectReminders(tasks, projects, reference),
    ...buildMilestoneReminders(tasks, projects, reference),
    ...buildFocusSessionReminders(wellness, reference),
    ...buildWellnessReminders(wellness, reference),
  ];

  return reminders.sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.title.localeCompare(b.title);
  });
}

export function filterDismissedReminders(
  reminders: KizunaReminder[],
  dismissedIds: string[]
): KizunaReminder[] {
  const dismissed = new Set(dismissedIds);
  return reminders.filter((reminder) => !dismissed.has(reminder.id));
}
