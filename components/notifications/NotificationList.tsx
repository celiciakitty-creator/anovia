"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatNotificationTimestamp } from "@/lib/notifications-db";
import { NOTIFICATION_TYPE_LABELS, type Notification } from "@/types/notification";
import { cn } from "@/lib/utils";

type NotificationListProps = {
  notifications: Notification[];
  isLoaded: boolean;
  loadError: string | null;
  onMarkRead: (notificationId: string) => Promise<void>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  compact?: boolean;
  showMarkAll?: boolean;
  onMarkAllRead?: () => Promise<void>;
  onNavigate?: () => void;
};

export function NotificationList({
  notifications,
  isLoaded,
  loadError,
  onMarkRead,
  onRefresh,
  isRefreshing = false,
  compact = false,
  showMarkAll = false,
  onMarkAllRead,
  onNavigate,
}: NotificationListProps) {
  const router = useRouter();

  const handleOpen = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await onMarkRead(notification.id);
      } catch {
        // Navigation can still proceed if mark-read fails.
      }
    }

    onNavigate?.();

    if (notification.link) {
      router.push(notification.link);
    }
  };

  if (!isLoaded) {
    return (
      <p className="text-sm text-muted-foreground">Loading notifications…</p>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
        <p className="text-sm text-danger" role="alert">
          {loadError}
        </p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-2 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5 text-center">
        <p className="text-sm font-medium text-foreground">All caught up</p>
        <p className="mt-1 text-xs text-muted-foreground">
          New assignments, deadlines, and messages will appear here.
        </p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="mt-3 text-xs font-medium text-primary underline-offset-4 hover:underline disabled:opacity-60"
          >
            {isRefreshing ? "Checking deadlines…" : "Check deadlines"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      {(showMarkAll && onMarkAllRead) || onRefresh ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {showMarkAll && onMarkAllRead ? (
            <button
              type="button"
              onClick={() => void onMarkAllRead()}
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              Mark all as read
            </button>
          ) : (
            <span />
          )}
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>
          ) : null}
        </div>
      ) : null}

      <ul className={cn("space-y-2", compact ? "" : "space-y-3")}>
        {notifications.map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => void handleOpen(notification)}
              className={cn(
                "w-full rounded-lg border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                notification.isRead
                  ? "border-border bg-card hover:bg-muted/30"
                  : "border-primary/20 bg-primary/5 hover:bg-primary/10"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {NOTIFICATION_TYPE_LABELS[notification.type]}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead ? (
                  <span
                    className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                    aria-label="Unread"
                  />
                ) : null}
              </div>
              <time
                className="mt-2 block text-[10px] text-muted-foreground"
                dateTime={notification.createdAt}
              >
                {formatNotificationTimestamp(notification.createdAt)}
              </time>
            </button>
          </li>
        ))}
      </ul>

      {!compact ? (
        <p className="mt-4 text-center">
          <Link
            href="/notifications"
            onClick={onNavigate}
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            View all notifications
          </Link>
        </p>
      ) : null}
    </div>
  );
}
