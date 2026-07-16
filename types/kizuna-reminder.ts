export type KizunaReminderCategory =
  | "deadline_soon"
  | "overdue"
  | "project_behind"
  | "project_inactive"
  | "milestone"
  | "focus_session"
  | "wellness";

export type KizunaReminderPriority = "gentle" | "helpful" | "celebration";

export type KizunaReminder = {
  id: string;
  category: KizunaReminderCategory;
  priority: KizunaReminderPriority;
  title: string;
  message: string;
  href?: string;
  entityId?: string;
  createdAt: string;
  toastEligible: boolean;
};

export type KizunaRemindersMeta = {
  dismissedIds: string[];
  toastedIds: string[];
  toastEnabled: boolean;
};

export const DEFAULT_KIZUNA_REMINDERS_META: KizunaRemindersMeta = {
  dismissedIds: [],
  toastedIds: [],
  toastEnabled: true,
};

export const KIZUNA_REMINDER_CATEGORY_LABELS: Record<
  KizunaReminderCategory,
  string
> = {
  deadline_soon: "Coming up",
  overdue: "Ready when you are",
  project_behind: "Gentle nudge",
  project_inactive: "Check-in",
  milestone: "Celebration",
  focus_session: "Focus balance",
  wellness: "Wellness",
};
