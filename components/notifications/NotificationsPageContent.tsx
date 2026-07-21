"use client";

import { MainLayout } from "@/components/layout";
import { Button } from "@/components/ui";
import { NotificationList } from "./NotificationList";
import { useNotifications } from "./NotificationProvider";

export function NotificationsPageContent() {
  const {
    notifications,
    unreadCount,
    isLoaded,
    isSyncing,
    loadError,
    refreshNotifications,
    markRead,
    markAllRead,
  } = useNotifications();

  return (
    <MainLayout subtitle="Notifications">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Assignments, approaching deadlines, overdue tasks, and direct
              messages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void refreshNotifications()}
              disabled={isSyncing}
            >
              {isSyncing ? "Refreshing…" : "Refresh"}
            </Button>
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void markAllRead()}
              >
                Mark all read
              </Button>
            ) : null}
          </div>
        </div>

        <NotificationList
          notifications={notifications}
          isLoaded={isLoaded}
          loadError={loadError}
          onMarkRead={markRead}
          onRefresh={() => void refreshNotifications()}
          isRefreshing={isSyncing}
          showMarkAll={unreadCount > 0}
          onMarkAllRead={markAllRead}
        />
      </div>
    </MainLayout>
  );
}
