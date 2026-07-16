"use client";

import type { KizunaReminder } from "@/types/kizuna-reminder";

type KizunaReminderToastStackProps = {
  reminders: KizunaReminder[];
  onDismiss: (id: string) => void;
};

export function KizunaReminderToastStack({
  reminders,
  onDismiss,
}: KizunaReminderToastStackProps) {
  if (reminders.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 right-4 z-[105] flex w-full max-w-sm flex-col gap-2 sm:right-6"
      role="status"
      aria-live="polite"
    >
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="kizuna-reminder-toast pointer-events-auto rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Kizuna · {reminder.title}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {reminder.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(reminder.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-muted"
            >
              Got it
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
