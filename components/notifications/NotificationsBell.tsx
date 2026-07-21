"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { NotificationList } from "./NotificationList";
import { useNotifications } from "./NotificationProvider";
import { cn } from "@/lib/utils";

export function NotificationsBell() {
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
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const visibleCount = isLoaded ? unreadCount : 0;
  const ariaLabel =
    visibleCount > 0
      ? `Notifications, ${visibleCount} unread`
      : "Notifications";

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted",
          open && "border-primary/40 bg-primary/5"
        )}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {visibleCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {visibleCount > 9 ? "9+" : visibleCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="fixed inset-x-4 top-[4.5rem] z-50 max-h-[min(28rem,calc(100dvh-6rem))] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-[var(--card-shadow)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.5rem)] sm:max-h-none sm:w-[min(22rem,calc(100vw-2rem))]"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Assignments, deadlines, and messages
              </p>
            </div>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>

          <NotificationList
            notifications={notifications.slice(0, 8)}
            isLoaded={isLoaded}
            loadError={loadError}
            onMarkRead={markRead}
            onRefresh={() => void refreshNotifications()}
            isRefreshing={isSyncing}
            compact
            showMarkAll={unreadCount > 0}
            onMarkAllRead={markAllRead}
            onNavigate={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
