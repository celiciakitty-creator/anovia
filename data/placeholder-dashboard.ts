import type {
  ActivityItem,
  ProjectPreview,
  TaskPreview,
} from "@/types/dashboard";

export const placeholderProjects: ProjectPreview[] = [
  { id: "1", name: "Product Launch", progress: 72, status: "active" },
  { id: "2", name: "Website Redesign", progress: 45, status: "active" },
  { id: "3", name: "Q3 Planning", progress: 100, status: "completed" },
];

export const placeholderTasks: TaskPreview[] = [
  {
    id: "1",
    title: "Review sprint backlog",
    dueDate: "Today",
    priority: "high",
    completed: false,
  },
  {
    id: "2",
    title: "Update project timeline",
    dueDate: "Tomorrow",
    priority: "medium",
    completed: false,
  },
  {
    id: "3",
    title: "Send weekly status report",
    dueDate: "Fri",
    priority: "low",
    completed: true,
  },
];

export const placeholderActivity: ActivityItem[] = [
  {
    id: "1",
    message: "Kizuna suggested prioritizing Product Launch tasks",
    timestamp: "2h ago",
    type: "ai",
  },
  {
    id: "2",
    message: "Sarah completed “Design mockups”",
    timestamp: "4h ago",
    type: "task",
  },
  {
    id: "3",
    message: "New comment on Website Redesign",
    timestamp: "Yesterday",
    type: "comment",
  },
];

export const weeklyProgress = {
  completed: 18,
  total: 24,
  days: [
    { day: "Mon", value: 4 },
    { day: "Tue", value: 3 },
    { day: "Wed", value: 5 },
    { day: "Thu", value: 2 },
    { day: "Fri", value: 4 },
    { day: "Sat", value: 0 },
    { day: "Sun", value: 0 },
  ],
};
