import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { WorkspaceData } from "@/types/workspace";
import { getProjectById, getProjectTasks } from "./workspace-utils";

/** Rule-based recommendation for Kizuna based on current workspace state. */
export function generateKizunaRecommendation(data: WorkspaceData): string {
  const { projects, tasks } = data;
  const openTasks = tasks.filter((t) => t.status !== "completed");
  const stuckTasks = openTasks.filter((t) => t.status === "stuck");
  const highPriority = openTasks.filter((t) => t.priority === "high");
  const dueSoon = openTasks.filter((t) => isDueWithinDays(t.dueDate, 2));

  if (openTasks.length === 0) {
    return "You're all caught up! Consider starting a new project or planning ahead for next week.";
  }

  if (stuckTasks.length > 0) {
    const task = stuckTasks[0];
    const project = getProjectById(projects, task.projectId);
    return `"${task.title}" on ${project?.name ?? "a project"} feels a little stuck — a small unblock or reassignment could help when you're ready.`;
  }

  if (highPriority.length >= 3) {
    const projectCounts = countByProject(highPriority);
    const topProject = Object.entries(projectCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];
    if (topProject) {
      const project = getProjectById(projects, topProject[0]);
      return `Focus on "${project?.name ?? "your top project"}" today — ${topProject[1]} high-priority tasks need attention.`;
    }
  }

  if (dueSoon.length > 0) {
    const task = dueSoon.sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];
    const project = getProjectById(projects, task.projectId);
    const dueLabel = isDueWithinDays(task.dueDate, 0) ? "today" : "soon";
    return `Whenever you're ready, "${task.title}" (${project?.name ?? "project"}) could use a little attention — it's due ${dueLabel}.`;
  }

  const activeProjects = projects.filter((p) => p.status === "active");
  if (activeProjects.length > 0) {
    const lagging = activeProjects
      .map((project) => ({
        project,
        progress: getProjectProgress(tasks, project),
      }))
      .sort((a, b) => a.progress - b.progress)[0];

    if (lagging && lagging.progress < 50) {
      return `"${lagging.project.name}" is at ${lagging.progress}% — a small check-in this week could feel really rewarding.`;
    }
  }

  const inProgress = openTasks.filter((t) => t.status === "in_progress");
  if (inProgress.length > 0) {
    return `You have ${inProgress.length} task${inProgress.length > 1 ? "s" : ""} in progress — finishing one could feel satisfying before starting something new.`;
  }

  return "Review your To Do column and pick one task to move forward today.";
}

function getProjectProgress(tasks: Task[], project: Project): number {
  const projectTasks = getProjectTasks(tasks, project.id);
  if (projectTasks.length === 0) return 0;
  const completed = projectTasks.filter((t) => t.status === "completed").length;
  return Math.round((completed / projectTasks.length) * 100);
}

function countByProject(tasks: Task[]): Record<string, number> {
  return tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.projectId] = (acc[task.projectId] ?? 0) + 1;
    return acc;
  }, {});
}

function isDueWithinDays(dateStr: string, days: number): boolean {
  const due = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}
