"use client";

import { Card, CardHeader, Select } from "@/components/ui";
import { REMINDER_INTERVAL_OPTIONS, REMINDER_LABELS, type ReminderType } from "@/types/wellness";
import { ToggleSwitch } from "./ToggleSwitch";
import { useWellness } from "./WellnessProvider";

const REMINDER_ORDER: ReminderType[] = ["eyeBreak", "stretch", "hydration"];

export function WellnessReminders() {
  const { data, updateReminder } = useWellness();

  return (
    <Card className="h-full">
      <CardHeader
        title="Wellness Reminders"
        description="Optional nudges — enable only what feels helpful."
      />

      <ul className="space-y-5">
        {REMINDER_ORDER.map((type) => {
          const pref = data.reminders[type];
          const meta = REMINDER_LABELS[type];

          return (
            <li key={type} className="space-y-3 border-b border-border pb-5 last:border-0 last:pb-0">
              <ToggleSwitch
                id={`reminder-${type}`}
                label={meta.title}
                description={meta.description}
                checked={pref.enabled}
                onChange={(enabled) => updateReminder(type, { enabled })}
              />
              {pref.enabled ? (
                <Select
                  label={`${meta.title} interval`}
                  name={`${type}-interval`}
                  value={String(pref.intervalMinutes)}
                  onChange={(event) =>
                    updateReminder(type, {
                      intervalMinutes: Number(event.target.value),
                    })
                  }
                  options={REMINDER_INTERVAL_OPTIONS.map((option) => ({
                    value: String(option.value),
                    label: option.label,
                  }))}
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
