"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useKizunaReminders } from "./KizunaReminderProvider";
import { KizunaReminderList } from "./KizunaReminderList";
import { PAGE_EMPTY_STATES } from "@/data/empty-states";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { reminders, reminderCount, dismissReminder, isHydrated } =
    useKizunaReminders();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const visibleCount = isHydrated ? reminderCount : 0;

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

  const ariaLabel =
    isHydrated && visibleCount > 0
      ? `Notifications, ${visibleCount} reminders`
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
        {isHydrated && visibleCount > 0 ? (
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
          aria-label="Kizuna reminders"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Kizuna reminders
              </p>
              <p className="text-xs text-muted-foreground">
                Friendly nudges, never pressure
              </p>
            </div>
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-primary hover:underline"
            >
              Dashboard
            </Link>
          </div>

          <KizunaReminderList
            reminders={isHydrated ? reminders.slice(0, 8) : []}
            onDismiss={(id) => dismissReminder(id)}
            compact
            emptyCopy={PAGE_EMPTY_STATES.reminders}
            emptyActionHref="/"
          />

          {isHydrated && reminders.length > 8 ? (
            <p className="mt-2 text-center text-xs text-muted-foreground">
              +{reminders.length - 8} more on your dashboard
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
