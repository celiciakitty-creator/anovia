export type KizunaChatRole = "user" | "assistant";

export type KizunaChatMessage = {
  id: string;
  role: KizunaChatRole;
  content: string;
  createdAt: string;
};

export type KizunaSuggestedQuestionId =
  | "focus_today"
  | "project_attention"
  | "overdue_tasks"
  | "completed_week"
  | "on_track"
  | "take_break"
  | "summarize";

export type KizunaSuggestedQuestion = {
  id: KizunaSuggestedQuestionId;
  text: string;
};

export const KIZUNA_SUGGESTED_QUESTIONS: KizunaSuggestedQuestion[] = [
  { id: "focus_today", text: "What should I focus on today?" },
  { id: "project_attention", text: "Which project needs attention?" },
  { id: "overdue_tasks", text: "Show my overdue tasks." },
  { id: "completed_week", text: "What have I completed this week?" },
  { id: "on_track", text: "Am I on track?" },
  { id: "take_break", text: "Should I take a break?" },
  { id: "summarize", text: "Summarize my progress." },
];

export const KIZUNA_CHAT_MAX_MESSAGES = 50;

export const KIZUNA_CHAT_FALLBACK =
  "I can currently help with your tasks, deadlines, progress, projects, and wellness habits. Try one of the suggested questions, or ask about what's due, overdue, or completed.";
