import type { SupabaseClient } from "@supabase/supabase-js";

import type { Notification, NotificationType } from "@/types/notification";

type DbNotificationRow = {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  dedup_key: string | null;
  created_at: string;
  read_at: string | null;
};

function mapNotificationRow(row: DbNotificationRow): Notification {
  return {
    id: row.id,
    recipientId: row.recipient_id,
    type: row.type,
    title: row.title,
    message: row.message,
    link: row.link,
    isRead: row.is_read,
    dedupKey: row.dedup_key,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function getNotifications(
  supabase: SupabaseClient,
  limit = 50
): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbNotificationRow[]).map(mapNotificationRow);
}

export async function getUnreadNotificationCount(
  supabase: SupabaseClient
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function syncDeadlineNotifications(
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.rpc("sync_deadline_notifications");

  if (error) {
    throw new Error(error.message);
  }
}

export async function markNotificationRead(
  supabase: SupabaseClient,
  notificationId: string
): Promise<void> {
  const { error } = await supabase.rpc("mark_notification_read", {
    p_notification_id: notificationId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function markAllNotificationsRead(
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.rpc("mark_all_notifications_read");

  if (error) {
    throw new Error(error.message);
  }
}

export function formatNotificationTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
