"use client";

import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { PAGE_EMPTY_STATES, type EmptyStateCopy } from "@/data/empty-states";
import { KIZUNA_REMINDER_CATEGORY_LABELS, type KizunaReminder } from "@/types/kizuna-reminder";
import { cn } from "@/lib/utils";

type KizunaReminderListProps = {
  reminders: KizunaReminder[];
  onDismiss?: (id: string) => void;
  compact?: boolean;
  emptyCopy?: EmptyStateCopy;
  onEmptyAction?: () => void;
  emptyActionHref?: string;
  /** @deprecated Use emptyCopy instead */
  emptyMessage?: string;
};

const PRIORITY_STYLES: Record<KizunaReminder["priority"], string> = {
  helpful: "border-primary/25 bg-primary/5",
  gentle: "border-border bg-muted/30",
  celebration: "border-success/25 bg-success/5",
};

export function KizunaReminderList({
  reminders,
  onDismiss,
  compact = false,
  emptyCopy = PAGE_EMPTY_STATES.remindersDashboard,
  onEmptyAction,
  emptyActionHref,
  emptyMessage,
}: KizunaReminderListProps) {
  if (reminders.length === 0) {
    return (
      <EmptyState
        compact
        title={emptyCopy.title}
        description={emptyMessage ?? emptyCopy.description}
        kizunaMessage={emptyCopy.kizunaMessage}
        emoji={emptyCopy.emoji}
        actionLabel={emptyCopy.actionLabel}
        onAction={onEmptyAction}
        actionHref={emptyActionHref}
        className="text-left"
      />
    );
  }

  return (
    <ul className={cn("space-y-2", compact && "max-h-80 overflow-y-auto pr-1")}>
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className={cn(
            "rounded-lg border p-3",
            PRIORITY_STYLES[reminder.priority]
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {reminder.title}
                </p>
                <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {KIZUNA_REMINDER_CATEGORY_LABELS[reminder.category]}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {reminder.message}
              </p>
              {reminder.href ? (
                <Link
                  href={reminder.href}
                  className="mt-2 inline-flex text-xs font-medium text-primary hover:underline"
                >
                  View details
                </Link>
              ) : null}
            </div>
            {onDismiss ? (
              <button
                type="button"
                onClick={() => onDismiss(reminder.id)}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                aria-label={`Dismiss reminder: ${reminder.title}`}
              >
                Dismiss
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
