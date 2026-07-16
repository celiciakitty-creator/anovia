"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useTheme } from "@/components/theme";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/types/theme";

const MODE_OPTIONS: {
  id: ThemeMode;
  label: string;
  description: string;
}[] = [
  { id: "light", label: "Light", description: "Always use light mode" },
  { id: "dark", label: "Dark", description: "Always use dark mode" },
  { id: "system", label: "System", description: "Match device settings" },
];

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
      />
    </svg>
  );
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
      />
    </svg>
  );
}

function ModeIcon({ mode, resolvedMode }: { mode: ThemeMode; resolvedMode: "light" | "dark" }) {
  if (mode === "system") return <SystemIcon className="h-4 w-4" />;
  if (mode === "dark" || resolvedMode === "dark") {
    return <MoonIcon className="h-4 w-4" />;
  }
  return <SunIcon className="h-4 w-4" />;
}

export function ThemeToggle() {
  const { mode, resolvedMode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Toggle theme"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
      >
        <ModeIcon mode={mode} resolvedMode={resolvedMode} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Theme options"
          className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-[var(--card-shadow)]"
        >
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={mode === option.id}
              onClick={() => {
                setMode(option.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                mode === option.id
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="mt-0.5 shrink-0">
                {option.id === "light" ? (
                  <SunIcon className="h-4 w-4" />
                ) : option.id === "dark" ? (
                  <MoonIcon className="h-4 w-4" />
                ) : (
                  <SystemIcon className="h-4 w-4" />
                )}
              </span>
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-[11px] leading-snug opacity-80">
                  {option.description}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
