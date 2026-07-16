export type DashboardStat = {
  label: string;
  value: string | number;
  change?: string;
};

export type ProjectPreview = {
  id: string;
  name: string;
  progress: number;
  status: "active" | "paused" | "completed";
};

export type TaskPreview = {
  id: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
};

export type ActivityItem = {
  id: string;
  message: string;
  timestamp: string;
  type: "task" | "project" | "comment" | "ai";
};
