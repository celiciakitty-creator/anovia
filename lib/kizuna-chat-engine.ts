import { getCompletionStats, getTaskCompletionTimestamp } from "@/lib/completion-utils";
import { getGrowthGardenStats } from "@/lib/growth-garden-utils";
import {
  formatDueDate,
  getProjectById,
  getUrgentTasks,
  getWeeklyCompletionStats,
} from "@/lib/workspace-utils";
import { getFocusSessionsToday } from "@/lib/wellness-utils";
import type { KizunaReminder } from "@/types/kizuna-reminder";
import {
  KIZUNA_CHAT_FALLBACK,
  KIZUNA_SUGGESTED_QUESTIONS,
  type KizunaSuggestedQuestionId,
} from "@/types/kizuna-chat";
import type { WellnessData } from "@/types/wellness";
import type { Task } from "@/types/task";
import type { WorkspaceData } from "@/types/workspace";
import type { EnrichedProject } from "@/lib/workspace-utils";

export type KizunaChatEngineContext = {
  workspace: WorkspaceData;
  projects: EnrichedProject[];
  wellness: WellnessData;
  reminders: KizunaReminder[];
  reference?: Date;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(dateStr: string): Date {
  return startOfDay(new Date(dateStr));
}

function getOpenTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status !== "completed");
}

function getOverdueTasks(tasks: Task[], reference: Date): Task[] {
  const today = startOfDay(reference);
  return getOpenTasks(tasks)
    .filter((task) => parseDate(task.dueDate) < today)
    .sort(
      (a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime()
    );
}

function getUpcomingTasks(tasks: Task[], reference: Date, withinDays = 2): Task[] {
  const today = startOfDay(reference);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + withinDays);

  return getOpenTasks(tasks)
    .filter((task) => {
      const due = parseDate(task.dueDate);
      return due >= today && due <= limit;
    })
    .sort(
      (a, b) => parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime()
    );
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const result = new Date(d);
  result.setDate(result.getDate() + diff);
  return result;
}

function getTasksCompletedThisWeek(tasks: Task[], reference: Date): Task[] {
  const weekStart = startOfWeek(reference);
  const weekEnd = endOfWeek(reference);

  return tasks.filter((task) => {
    if (task.status !== "completed") return false;
    const timestamp = getTaskCompletionTimestamp(task);
    if (!timestamp) return false;
    const completedDate = new Date(timestamp);
    return completedDate >= weekStart && completedDate <= weekEnd;
  });
}

function normalizeQuestion(input: string): string {
  return input.trim().toLowerCase().replace(/[?!.]+$/g, "");
}

function matchQuestionId(input: string): KizunaSuggestedQuestionId | null {
  const normalized = normalizeQuestion(input);

  for (const question of KIZUNA_SUGGESTED_QUESTIONS) {
    if (normalizeQuestion(question.text) === normalized) {
      return question.id;
    }
  }

  if (
    /focus|priorit|today|what should i work/.test(normalized) &&
    !/break/.test(normalized)
  ) {
    return "focus_today";
  }
  if (/project.*(attention|behind|lag|need)/.test(normalized) || /which project/.test(normalized)) {
    return "project_attention";
  }
  if (/overdue|past due|late task/.test(normalized)) {
    return "overdue_tasks";
  }
  if (/completed.*week|finished.*week|done this week/.test(normalized)) {
    return "completed_week";
  }
  if (/on track|keeping up|behind schedule/.test(normalized)) {
    return "on_track";
  }
  if (/break|rest|pause|tired/.test(normalized)) {
    return "take_break";
  }
  if (/summar|overview|progress report|how am i doing/.test(normalized)) {
    return "summarize";
  }

  return null;
}

function formatTaskLine(task: Task, projects: EnrichedProject[]): string {
  const project = getProjectById(projects, task.projectId);
  return `"${task.title}" (${project?.name ?? "project"}) — due ${formatDueDate(task.dueDate)}, ${task.priority} priority`;
}

function answerFocusToday(ctx: KizunaChatEngineContext): string {
  const { workspace, projects } = ctx;
  const reference = ctx.reference ?? new Date();
  const overdue = getOverdueTasks(workspace.tasks, reference);
  const upcoming = getUpcomingTasks(workspace.tasks, reference, 1);
  const urgent = getUrgentTasks(workspace.tasks, 3);

  if (urgent.length === 0 && overdue.length === 0 && upcoming.length === 0) {
    return "Based on your workspace, nothing urgent is flagged right now. You could pick one open task that would feel satisfying to move forward — even a small step counts.";
  }

  const lines: string[] = [
    "Here's what stands out from your current tasks:",
  ];

  if (overdue.length > 0) {
    lines.push(
      `• Overdue: ${formatTaskLine(overdue[0], projects)}${overdue.length > 1 ? ` (+${overdue.length - 1} more)` : ""}`
    );
  }

  if (upcoming.length > 0) {
    lines.push(`• Due soon: ${formatTaskLine(upcoming[0], projects)}`);
  }

  if (urgent.length > 0 && !overdue.includes(urgent[0]) && !upcoming.includes(urgent[0])) {
    lines.push(`• High priority: ${formatTaskLine(urgent[0], projects)}`);
  }

  lines.push("Pick whichever feels most doable — momentum matters more than perfection.");
  return lines.join("\n");
}

function answerProjectAttention(ctx: KizunaChatEngineContext): string {
  const active = ctx.projects.filter((p) => p.status === "active");
  if (active.length === 0) {
    return "You don't have any active projects right now. When you're ready, starting or reopening a project could help organize your next steps.";
  }

  const ranked = [...active].sort((a, b) => {
    if (a.progress !== b.progress) return a.progress - b.progress;
    return parseDate(a.dueDate).getTime() - parseDate(b.dueDate).getTime();
  });

  const project = ranked[0];
  const dueLabel = formatDueDate(project.dueDate);

  if (project.progress < 40) {
    return `"${project.name}" is at ${project.progress}% with ${project.taskCount} task${project.taskCount !== 1 ? "s" : ""} and due ${dueLabel}. A small check-in there could create some gentle momentum when you're ready.`;
  }

  return `"${project.name}" has the most room to grow among active projects (${project.progress}%, due ${dueLabel}). Even one completed task would move it forward nicely.`;
}

function answerOverdueTasks(ctx: KizunaChatEngineContext): string {
  const reference = ctx.reference ?? new Date();
  const overdue = getOverdueTasks(ctx.workspace.tasks, reference);

  if (overdue.length === 0) {
    return "Good news — I don't see any overdue open tasks in your workspace. That's a calm place to be.";
  }

  const preview = overdue
    .slice(0, 5)
    .map((task) => `• ${formatTaskLine(task, ctx.projects)}`)
    .join("\n");

  const suffix =
    overdue.length > 5
      ? `\n\n…and ${overdue.length - 5} more. Tackle them at your own pace — one at a time is enough.`
      : "\n\nNo rush — choose one that feels manageable when you're ready.";

  return `You have ${overdue.length} overdue open task${overdue.length !== 1 ? "s" : ""}:\n${preview}${suffix}`;
}

function answerCompletedWeek(ctx: KizunaChatEngineContext): string {
  const reference = ctx.reference ?? new Date();
  const stats = getCompletionStats(ctx.workspace.tasks, reference);
  const completed = getTasksCompletedThisWeek(ctx.workspace.tasks, reference);

  if (stats.completedThisWeek === 0) {
    return "I don't see any tasks completed this week yet. That's okay — the week isn't over, and a single finished task can shift the tone.";
  }

  const names = completed
    .slice(0, 4)
    .map((task) => `"${task.title}"`)
    .join(", ");

  const extra =
    completed.length > 4 ? ` and ${completed.length - 4} more` : "";

  return `You've completed ${stats.completedThisWeek} task${stats.completedThisWeek !== 1 ? "s" : ""} this week${names ? `, including ${names}${extra}` : ""}. That's real progress worth acknowledging.`;
}

function answerOnTrack(ctx: KizunaChatEngineContext): string {
  const reference = ctx.reference ?? new Date();
  const weekly = getWeeklyCompletionStats(ctx.workspace.tasks, reference);
  const overdue = getOverdueTasks(ctx.workspace.tasks, reference);
  const activeProjects = ctx.projects.filter((p) => p.status === "active");
  const lagging = activeProjects.filter((p) => p.progress < 50);

  const parts: string[] = [];

  if (weekly.total > 0) {
    parts.push(
      `This week: ${weekly.completed} of ${weekly.total} due tasks completed (${weekly.percentage}%).`
    );
  } else {
    parts.push("No tasks are due this week in your workspace.");
  }

  if (overdue.length > 0) {
    parts.push(
      `${overdue.length} open task${overdue.length !== 1 ? "s are" : " is"} overdue — you can revisit ${overdue.length === 1 ? "it" : "them"} whenever you're ready.`
    );
  } else {
    parts.push("Nothing is overdue right now.");
  }

  if (lagging.length > 0) {
    parts.push(
      `"${lagging[0].name}" is at ${lagging[0].progress}% and may benefit from a check-in.`
    );
  }

  parts.push(
    overdue.length === 0 && weekly.percentage >= 50
      ? "Overall, you're moving steadily — keep honoring your own pace."
      : "You're not behind as a person — this is just a snapshot of your task list, and small steps still count."
  );

  return parts.join(" ");
}

function answerTakeBreak(ctx: KizunaChatEngineContext): string {
  const reference = ctx.reference ?? new Date();
  const sessions = getFocusSessionsToday(ctx.wellness, reference);
  const { focusTimer, checkIn } = ctx.wellness;
  const activeSession = Boolean(focusTimer.activeSessionStartedAt);

  if (activeSession) {
    return "You're in an active focus session right now. A short pause — water, a stretch, or looking away from the screen — could help you sustain that focus kindly.";
  }

  if (sessions >= 2) {
    return `You've completed ${sessions} focus session${sessions !== 1 ? "s" : ""} today. That kind of effort adds up — a gentle break could feel really good right about now.`;
  }

  if (checkIn.mood === "stressed" || checkIn.mood === "tired") {
    return "Your wellness check-in suggests you might be running low on energy. A brief break, hydration, or a few quiet minutes could be a caring choice.";
  }

  if (ctx.reminders.length >= 3) {
    return "You have several reminders queued — that can be a signal to breathe and reset before pushing further. Even five minutes away from the screen helps.";
  }

  return "Based on your current data, a break isn't urgent, but it's always allowed. If your body is asking for rest, listening is productive too.";
}

function answerSummarize(ctx: KizunaChatEngineContext): string {
  const reference = ctx.reference ?? new Date();
  const completion = getCompletionStats(ctx.workspace.tasks, reference);
  const garden = getGrowthGardenStats(ctx.workspace.tasks, reference);
  const sessions = getFocusSessionsToday(ctx.wellness, reference);
  const activeProjects = ctx.projects.filter((p) => p.status === "active");
  const overdue = getOverdueTasks(ctx.workspace.tasks, reference);
  const openCount = getOpenTasks(ctx.workspace.tasks).length;

  const lines = [
    "Here's a snapshot from your stored workspace and wellness data:",
    `• ${openCount} open task${openCount !== 1 ? "s" : ""}, ${overdue.length} overdue`,
    `• ${completion.completedToday} completed today, ${completion.completedThisWeek} this week`,
    `• ${completion.streakDays}-day completion streak`,
    `• Growth garden: ${garden.stage} stage (${garden.progress}%)`,
    `• ${activeProjects.length} active project${activeProjects.length !== 1 ? "s" : ""}`,
  ];

  if (sessions > 0) {
    lines.push(`• ${sessions} focus session${sessions !== 1 ? "s" : ""} today`);
  }

  if (ctx.wellness.focusMusic.preferredSound) {
    lines.push("• A preferred focus sound is saved in Wellness");
  }

  lines.push("This is based on your local data — not predictions, just where things stand right now.");
  return lines.join("\n");
}

const ANSWER_HANDLERS: Record<
  KizunaSuggestedQuestionId,
  (ctx: KizunaChatEngineContext) => string
> = {
  focus_today: answerFocusToday,
  project_attention: answerProjectAttention,
  overdue_tasks: answerOverdueTasks,
  completed_week: answerCompletedWeek,
  on_track: answerOnTrack,
  take_break: answerTakeBreak,
  summarize: answerSummarize,
};

/** Generate a rule-based Kizuna reply from local workspace and wellness data. */
export function generateKizunaChatResponse(
  userMessage: string,
  context: KizunaChatEngineContext
): string {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    return "Ask me about your tasks, projects, deadlines, progress, or wellness — I'm reading from your local workspace data.";
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
