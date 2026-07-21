import {
  buildWeeklySummary,
  getCompletedTasks,
  getFallingBehindProjects,
  getMyOpenTasks,
  getOpenTasks,
  getOverdueTasks,
  getTasksDueToday,
  getTopAssignees,
  rankNextTasks,
} from "@/lib/kizuna-queries";
import {
  formatDueDate,
  getProjectById,
  getUserById,
} from "@/lib/workspace-utils";
import { TASK_STATUS_LABELS } from "@/types/task";
import {
  KIZUNA_CHAT_FALLBACK,
  KIZUNA_SUGGESTED_QUESTIONS,
  type KizunaSuggestedQuestionId,
} from "@/types/kizuna-chat";
import type { KizunaReminder } from "@/types/kizuna-reminder";
import type { WellnessData } from "@/types/wellness";
import type { Task } from "@/types/task";
import type { WorkspaceData } from "@/types/workspace";
import type { EnrichedProject } from "@/lib/workspace-utils";

export type KizunaChatEngineContext = {
  workspace: WorkspaceData;
  projects: EnrichedProject[];
  wellness: WellnessData;
  reminders: KizunaReminder[];
  currentUserId: string | null;
  reference?: Date;
};

const PREVIEW_LIMIT = 5;

function normalizeQuestion(input: string): string {
  return input.trim().toLowerCase().replace(/[?!.]+$/g, "");
}

export function matchQuestionId(input: string): KizunaSuggestedQuestionId | null {
  const normalized = normalizeQuestion(input);

  for (const question of KIZUNA_SUGGESTED_QUESTIONS) {
    if (normalizeQuestion(question.text) === normalized) {
      return question.id;
    }
  }

  if (/due today|due.*today|today'?s tasks/.test(normalized)) {
    return "due_today";
  }
  if (/overdue|past due|late task/.test(normalized)) {
    return "overdue_tasks";
  }
  if (
    /what should i work on next|work on next|next task|what to do next/.test(
      normalized
    )
  ) {
    return "work_next";
  }
  if (/show my tasks|my tasks|tasks assigned to me/.test(normalized)) {
    return "my_tasks";
  }
  if (
    /project.*(fall|behind|lag|attention)|which projects/.test(normalized)
  ) {
    return "projects_falling_behind";
  }
  if (/summar.*week|this week|weekly summary/.test(normalized)) {
    return "summarize_week";
  }
  if (/who has the most|most assigned|most tasks assigned/.test(normalized)) {
    return "most_assigned";
  }
  if (
    /how many.*completed|completed tasks|tasks completed|completion count/.test(
      normalized
    )
  ) {
    return "completed_count";
  }

  return null;
}

function formatTaskLine(task: Task, projects: EnrichedProject[]): string {
  const project = getProjectById(projects, task.projectId);
  const statusLabel = TASK_STATUS_LABELS[task.status];
  return `"${task.title}" (${project?.name ?? "project"}) — ${statusLabel}, due ${formatDueDate(task.dueDate)}, ${task.priority} priority`;
}

function formatTaskPreview(
  tasks: Task[],
  projects: EnrichedProject[],
  limit = PREVIEW_LIMIT
): string {
  return tasks
    .slice(0, limit)
    .map((task) => `• ${formatTaskLine(task, projects)}`)
    .join("\n");
}

function formatOverflow(count: number, limit = PREVIEW_LIMIT): string {
  if (count <= limit) return "";
  return `\n\n…and ${count - limit} more. One step at a time is enough.`;
}

function noProjectsMessage(): string {
  return "Create your first project so Kizuna can help you plan. Once projects and tasks are in your workspace, I can suggest what to focus on.";
}

function answerDueToday(ctx: KizunaChatEngineContext): string {
  if (ctx.projects.length === 0) return noProjectsMessage();

  const reference = ctx.reference ?? new Date();
  const dueToday = getTasksDueToday(ctx.workspace.tasks, reference);

  if (dueToday.length === 0) {
    return "Nothing is due today — a good moment to get ahead on something that matters to you, or to take a breather.";
  }

  return `You have ${dueToday.length} open task${dueToday.length !== 1 ? "s" : ""} due today:\n${formatTaskPreview(dueToday, ctx.projects)}${formatOverflow(dueToday.length)}`;
}

function answerOverdueTasks(ctx: KizunaChatEngineContext): string {
  if (ctx.projects.length === 0) return noProjectsMessage();

  const reference = ctx.reference ?? new Date();
  const overdue = getOverdueTasks(ctx.workspace.tasks, reference);

  if (overdue.length === 0) {
    return "You do not have any overdue tasks. That is a calm place to be — keep honoring your pace.";
  }

  return `You have ${overdue.length} overdue open task${overdue.length !== 1 ? "s" : ""}:\n${formatTaskPreview(overdue, ctx.projects)}${formatOverflow(overdue.length)}\n\nPick one that feels manageable when you are ready.`;
}

function answerWorkNext(ctx: KizunaChatEngineContext): string {
  if (ctx.projects.length === 0) return noProjectsMessage();

  const reference = ctx.reference ?? new Date();
  const ranked = rankNextTasks(ctx.workspace.tasks, reference);

  if (ranked.length === 0) {
    return "You do not have any open tasks right now. Add a task when you are ready, and I can help you prioritize.";
  }

  const top = ranked[0];
  const lines = [
    "Based on overdue status, due dates, priority, and in-progress work, I would suggest:",
    `• ${formatTaskLine(top, ctx.projects)}`,
  ];

  const alternates = ranked.slice(1, 3);
  if (alternates.length > 0) {
    lines.push("", "Also worth a look:");
    for (const task of alternates) {
      lines.push(`• ${formatTaskLine(task, ctx.projects)}`);
    }
  }

  lines.push(
    "",
    "Ranking: overdue first, then due soon, then high priority, then in-progress tasks."
  );
  return lines.join("\n");
}

function answerMyTasks(ctx: KizunaChatEngineContext): string {
  if (!ctx.currentUserId) {
    return "Sign in to see tasks assigned to you. Your workspace data loads after authentication.";
  }

  const myOpen = getMyOpenTasks(ctx.workspace.tasks, ctx.currentUserId);
  const user = getUserById(ctx.workspace.users, ctx.currentUserId);
  const label = user?.displayName.trim() || user?.name || "You";

  if (myOpen.length === 0) {
    return `${label}, you do not have any open tasks assigned right now. Check the Tasks page to pick something up, or enjoy the clear runway.`;
  }

  return `${label}, you have ${myOpen.length} open task${myOpen.length !== 1 ? "s" : ""}:\n${formatTaskPreview(myOpen, ctx.projects)}${formatOverflow(myOpen.length)}`;
}

function answerProjectsFallingBehind(ctx: KizunaChatEngineContext): string {
  if (ctx.projects.length === 0) return noProjectsMessage();

  const active = ctx.projects.filter((project) => project.status === "active");
  if (active.length === 0) {
    return "You do not have any active projects. Reactivate or create a project when you are ready to track progress.";
  }

  const fallingBehind = getFallingBehindProjects(ctx.projects);
  if (fallingBehind.length === 0) {
    return "Your active projects all have tasks tracked — nothing looks unusually behind right now.";
  }

  const preview = fallingBehind
    .slice(0, PREVIEW_LIMIT)
    .map(
      (project) =>
        `• "${project.name}" — ${project.progress}% complete (${project.taskCount} task${project.taskCount !== 1 ? "s" : ""}, due ${formatDueDate(project.dueDate)})`
    )
    .join("\n");

  return `These active projects have the lowest completion rates:\n${preview}${formatOverflow(fallingBehind.length)}\n\nEven one finished task can lift a project's momentum.`;
}

function answerSummarizeWeek(ctx: KizunaChatEngineContext): string {
  if (ctx.projects.length === 0) return noProjectsMessage();

  const reference = ctx.reference ?? new Date();
  const summary = buildWeeklySummary(
    ctx.workspace.tasks,
    ctx.projects,
    reference
  );

  const lines = [
    "Here is your week at a glance:",
    `• ${summary.completedThisWeek} task${summary.completedThisWeek !== 1 ? "s" : ""} completed this week`,
    `• ${summary.openTasks} task${summary.openTasks !== 1 ? "s" : ""} still open`,
    `• ${summary.overdueCount} overdue task${summary.overdueCount !== 1 ? "s" : ""}`,
  ];

  if (summary.overdueCount === 0) {
    lines.push("• No overdue tasks — nice and steady.");
  }

  if (summary.laggingProjects.length > 0) {
    lines.push("", "Projects with the lowest completion:");
    for (const project of summary.laggingProjects) {
      lines.push(
        `• "${project.name}" — ${project.progress}% (${project.taskCount} task${project.taskCount !== 1 ? "s" : ""})`
      );
    }
  } else if (ctx.projects.some((project) => project.status === "active")) {
    lines.push("", "Active projects are tracking evenly — no standouts falling behind.");
  }

  lines.push("", "This summary uses your live workspace data — not predictions.");
  return lines.join("\n");
}

function answerMostAssigned(ctx: KizunaChatEngineContext): string {
  const topAssignees = getTopAssignees(
    ctx.workspace.tasks,
    ctx.workspace.users
  );

  if (topAssignees.length === 0) {
    return "No open tasks are assigned to teammates yet. Assign tasks from the Tasks page when you are ready.";
  }

  const count = topAssignees[0].count;
  const names = topAssignees.map((entry) => entry.displayName).join(", ");

  if (topAssignees.length === 1) {
    return `${names} has the most assigned open tasks right now — ${count} task${count !== 1 ? "s" : ""}.`;
  }

  return `${names} are tied for the most assigned open tasks — ${count} each.`;
}

function answerCompletedCount(ctx: KizunaChatEngineContext): string {
  const completed = getCompletedTasks(ctx.workspace.tasks);
  const open = getOpenTasks(ctx.workspace.tasks).length;
  const total = ctx.workspace.tasks.length;

  if (total === 0) {
    return "Your workspace does not have any tasks yet. Create a project and add tasks to start tracking completions.";
  }

  let message = `${completed.length} of ${total} task${total !== 1 ? "s" : ""} ${completed.length === 1 ? "is" : "are"} completed (${open} still open).`;

  if (ctx.currentUserId) {
    const myCompleted = completed.filter(
      (task) =>
        task.assigneeId === ctx.currentUserId ||
        (task.assigneeId === null && task.createdBy === ctx.currentUserId)
    ).length;
    if (myCompleted > 0) {
      message += ` You have completed ${myCompleted} of those.`;
    }
  }

  return message;
}

const ANSWER_HANDLERS: Record<
  KizunaSuggestedQuestionId,
  (ctx: KizunaChatEngineContext) => string
> = {
  due_today: answerDueToday,
  overdue_tasks: answerOverdueTasks,
  work_next: answerWorkNext,
  my_tasks: answerMyTasks,
  projects_falling_behind: answerProjectsFallingBehind,
  summarize_week: answerSummarizeWeek,
  most_assigned: answerMostAssigned,
  completed_count: answerCompletedCount,
};

/** Generate a rule-based Kizuna reply from local workspace data. */
export function generateKizunaChatResponse(
  userMessage: string,
  context: KizunaChatEngineContext
): string {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return "Ask about due dates, overdue work, your tasks, project progress, weekly summaries, or completion counts — I read from your workspace data.";
  }

  const questionId = matchQuestionId(trimmed);
  if (questionId) {
    return ANSWER_HANDLERS[questionId](context);
  }

  return KIZUNA_CHAT_FALLBACK;
}

export function getSupportedQuestionTypes(): KizunaSuggestedQuestionId[] {
  return Object.keys(ANSWER_HANDLERS) as KizunaSuggestedQuestionId[];
}

export function formatChatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
