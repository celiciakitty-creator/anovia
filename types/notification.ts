export type NotificationType =
  | "task_assigned"
  | "task_deadline_approaching"
  | "task_overdue"
  | "direct_message_received";

export type Notification = {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  dedupKey: string | null;
  createdAt: string;
  readAt: string | null;
};

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  task_assigned: "Task assigned",
  task_deadline_approaching: "Deadline approaching",
  task_overdue: "Overdue task",
  direct_message_received: "Direct message",
};
