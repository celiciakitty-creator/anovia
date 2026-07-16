"use client";

import { cn } from "@/lib/utils";

type ToggleSwitchProps = {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  className,
}: ToggleSwitchProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          checked
            ? "border-primary bg-primary"
            : "border-border bg-muted"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 rounded-full bg-card shadow-sm transition-transform duration-200",
            checked ? "translate-x-6" : "translate-x-1"
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}
