export type TaskStatus =
  | "todo"
  | "in_progress"
  | "stuck"
  | "review"
  | "completed";

export type Priority = "low" | "medium" | "high";

export type Label = {
  id: string;
  name: string;
  /** Semantic theme token for label color styling */
  color: "primary" | "accent" | "success" | "warning" | "danger" | "secondary";
};

export type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assigneeId: string | null;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: number;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
  /** ISO timestamp when the task was marked completed */
  completedAt: string | null;
};

export type TaskInput = {
  title: string;
  description: string;
  projectId: string;
  assigneeId: string | null;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  estimatedMinutes: number;
  labelIds: string[];
};

/** Maximum characters allowed in a task description. */
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "stuck",
  "review",
  "completed",
];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  stuck: "Stuck",
  review: "Review",
  completed: "Completed",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};
