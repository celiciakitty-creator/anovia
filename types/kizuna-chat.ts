export type KizunaChatRole = "user" | "assistant";

export type KizunaChatMessage = {
  id: string;
  role: KizunaChatRole;
  content: string;
  createdAt: string;
};

export type KizunaSuggestedQuestionId =
  | "due_today"
  | "overdue_tasks"
  | "work_next"
  | "my_tasks"
  | "projects_falling_behind"
  | "summarize_week"
  | "most_assigned"
  | "completed_count";

export type KizunaSuggestedQuestion = {
  id: KizunaSuggestedQuestionId;
  text: string;
};

export const KIZUNA_SUGGESTED_QUESTIONS: KizunaSuggestedQuestion[] = [
  { id: "due_today", text: "What tasks are due today?" },
  { id: "overdue_tasks", text: "What tasks are overdue?" },
  { id: "work_next", text: "What should I work on next?" },
  { id: "my_tasks", text: "Show my tasks." },
  { id: "projects_falling_behind", text: "Which projects are falling behind?" },
  { id: "summarize_week", text: "Summarize this week." },
  { id: "most_assigned", text: "Who has the most assigned tasks?" },
  { id: "completed_count", text: "How many tasks are completed?" },
];

export const KIZUNA_CHAT_MAX_MESSAGES = 50;

export const KIZUNA_CHAT_FALLBACK =
  "I can help with due dates, overdue tasks, your assignments, project progress, weekly summaries, and completion counts. Try a suggested question below, or ask in your own words.";
