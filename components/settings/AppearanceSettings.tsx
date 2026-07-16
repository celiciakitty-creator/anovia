"use client";

import { Button, Card, CardHeader } from "@/components/ui";
import { useTheme } from "@/components/theme";
import {
  APPEARANCE_COLOR_TOKENS,
  COLOR_PRESET_OPTIONS,
  type AppearanceColorToken,
} from "@/lib/theme-presets";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/types/theme";

const MODE_OPTIONS: { id: ThemeMode; label: string; description: string }[] = [
  { id: "light", label: "Light mode", description: "Bright, clean workspace" },
  { id: "dark", label: "Dark mode", description: "Reduced glare for focus" },
  {
    id: "system",
    label: "System",
    description: "Follow your device appearance",
  },
];

const CUSTOM_COLOR_LABELS: Record<AppearanceColorToken, string> = {
  primary: "Primary color",
  accent: "Accent color",
};

export function AppearanceSettings() {
  const {
    mode,
    resolvedMode,
    preset,
    customColors,
    setMode,
    setPreset,
    setCustomColor,
    resetToAnoviaDefault,
  } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Appearance"
          description="Customize how Anovia looks on your device"
        />

        <div className="space-y-8">
          <section aria-labelledby="appearance-mode-heading">
            <h3
              id="appearance-mode-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Mode
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Currently showing{" "}
              <span className="font-medium text-foreground">{resolvedMode}</span>
              {mode === "system" ? " (system preference)" : ""}.
            </p>
            <div
              className="mt-3 grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-labelledby="appearance-mode-heading"
            >
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={mode === option.id}
                  onClick={() => setMode(option.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    mode === option.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg border border-border",
                        option.id === "light"
                          ? "bg-card"
                          : option.id === "dark"
                            ? "bg-foreground"
                            : "bg-gradient-to-br from-card to-muted"
                      )}
                      aria-hidden
                    >
                      <span
                        className={cn(
                          "h-4 w-4 rounded-full",
                          option.id === "light"
                            ? "bg-primary"
                            : option.id === "dark"
                              ? "bg-primary/80"
                              : "bg-gradient-to-br from-primary to-accent"
                        )}
                      />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="appearance-preset-heading">
            <h3
              id="appearance-preset-heading"
              className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Theme preset
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Updates primary and accent colors across buttons, progress bars,
              navigation, badges, and dashboard accents.
            </p>
            <div
              className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              role="radiogroup"
              aria-labelledby="appearance-preset-heading"
            >
              {COLOR_PRESET_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={preset === option.id}
                  onClick={() => setPreset(option.id)}
                  className={cn(
                    "rounded-xl border p-4 text-left transition-colors",
                    preset === option.id
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border bg-muted/40 hover:border-primary/40 hover:bg-muted/60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card"
                      aria-hidden
                    >
                      <span
                        className="h-5 w-5 rounded-full"
                        style={{ backgroundColor: option.swatch }}
                      />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {option.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="appearance-custom-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3
                  id="appearance-custom-heading"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Custom colors
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Override primary and accent. Works in both light and dark mode.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={resetToAnoviaDefault}
              >
                Reset to Anovia default
              </Button>
            </div>

            <div
              className={cn(
                "mt-3 rounded-xl border p-4 transition-colors",
                preset === "custom"
                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                  : "border-border bg-muted/40"
              )}
            >
              <p className="text-sm font-medium text-foreground">
                {preset === "custom" ? "Custom colors active" : "Custom colors"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Adjust either color to switch to a custom theme instantly.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {APPEARANCE_COLOR_TOKENS.map((token) => (
                  <label
                    key={token}
                    htmlFor={`appearance-${token}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-3 transition-colors hover:bg-muted/50"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {CUSTOM_COLOR_LABELS[token]}
                    </span>
                    <input
                      id={`appearance-${token}`}
                      type="color"
                      value={customColors[token]}
                      onChange={(event) => {
                        setCustomColor(token, event.target.value);
                      }}
                      className="h-9 w-12 cursor-pointer rounded border border-border bg-card p-0.5"
                      aria-label={CUSTOM_COLOR_LABELS[token]}
                    />
                  </label>
                ))}
              </div>
            </div>
          </section>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Preview"
          description="How your appearance settings look in context"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="text-xs text-muted-foreground">Background</p>
            <p className="text-sm font-medium text-foreground">Page surface</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3 shadow-[var(--card-shadow)]">
            <p className="text-xs text-muted-foreground">Card</p>
            <p className="text-sm font-medium text-foreground">Card surface</p>
          </div>
          <div className="rounded-lg bg-primary p-3 text-primary-foreground">
            <p className="text-xs opacity-80">Primary</p>
            <p className="text-sm font-medium">Action button</p>
          </div>
          <div className="rounded-lg bg-accent p-3 text-accent-foreground">
            <p className="text-xs opacity-80">Accent</p>
            <p className="text-sm font-medium">Highlight</p>
          </div>
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
            <p className="text-xs text-primary">Active nav</p>
            <p className="text-sm font-medium text-foreground">Selected item</p>
          </div>
          <div className="rounded-lg bg-primary/15 p-3">
            <span className="inline-flex rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
              Badge
            </span>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-3/4 rounded-full bg-primary" />
            </div>
          </div>
          <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-3 text-primary-foreground">
            <p className="text-xs opacity-80">Gradient</p>
            <p className="text-sm font-medium">Welcome hero</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-border bg-card px-3 py-2 text-left ring-primary transition-shadow focus-visible:outline-none focus-visible:ring-2"
          >
            <p className="text-xs text-muted-foreground">Focus state</p>
            <p className="text-sm font-medium text-foreground">Tab to focus</p>
          </button>
        </div>
      </Card>
    </div>
  );
}
