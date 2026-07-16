"use client";

import { Card, CardHeader } from "@/components/ui";
import { AskKizunaButton, KizunaReminderList, useKizunaReminders, useKizunaChat } from "@/components/kizuna";
import { useHydrated } from "@/hooks/useHydrated";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { generateKizunaRecommendation } from "@/lib/kizuna-recommendations";
import { useWorkspace } from "@/components/workspace";

const PRE_HYDRATION_RECOMMENDATION =
  "Review your workspace and pick one next step when you're ready.";

export function KizunaAI() {
  const { raw } = useWorkspace();
  const isHydrated = useHydrated();
  const { reminders, reminderCount, dismissReminder, isHydrated: remindersReady } =
    useKizunaReminders();
  const { openChat } = useKizunaChat();
  const recommendation = isHydrated
    ? generateKizunaRecommendation(raw)
    : PRE_HYDRATION_RECOMMENDATION;
  const showReminders = isHydrated && remindersReady;
  const topReminders = showReminders ? reminders.slice(0, 4) : [];
  const statusLabel =
    !showReminders || reminderCount === 0
      ? "All clear"
      : `${reminderCount} reminders`;

  return (
    <Card className="h-full">
      <CardHeader
        title={AI_ASSISTANT_NAME}
        description="Your smart reminder companion"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AskKizunaButton variant="primary" size="sm" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {statusLabel}
            </span>
          </div>
        }
      />

      <div className="space-y-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">
            {AI_ASSISTANT_NAME} suggests
          </p>
          <p className="mt-1 text-sm text-foreground">{recommendation}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Smart reminders
          </p>
          <KizunaReminderList
            reminders={topReminders}
            onDismiss={dismissReminder}
            onEmptyAction={openChat}
          />
        </div>
      </div>
    </Card>
  );
}
