"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useWorkspace } from "@/components/workspace";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { TASK_STATUS_STYLES } from "@/lib/workspace-utils";
import { cn } from "@/lib/utils";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  type TaskStatus,
} from "@/types/task";

type TaskStatusChipProps = {
  taskId: string;
  status: TaskStatus;
  onStatusChange?: (status: TaskStatus) => void;
  className?: string;
  size?: "sm" | "md";
};

export function TaskStatusChip({
  taskId,
  status,
  onStatusChange,
  className,
  size = "sm",
}: TaskStatusChipProps) {
  const { updateTaskStatus } = useWorkspace();
  const prefersReducedMotion = usePrefersReducedMotion();
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [justChanged, setJustChanged] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectStatus = async (next: TaskStatus) => {
    if (next === status) {
      setOpen(false);
      return;
    }

    setUpdateError(null);

    try {
      await updateTaskStatus(taskId, next);
      onStatusChange?.(next);
      setOpen(false);

      if (!prefersReducedMotion) {
        setJustChanged(true);
        window.setTimeout(() => setJustChanged(false), 450);
      }
    } catch (error) {
      setUpdateError(
        error instanceof Error ? error.message : "Unable to update task status."
      );
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative inline-flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-transparent font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
          TASK_STATUS_STYLES[status],
          justChanged && "task-status-chip--changed"
        )}
      >
        {TASK_STATUS_LABELS[status]}
        <svg
          className={cn(
            "h-3 w-3 shrink-0 opacity-70 transition-transform duration-200",
            open && "rotate-180",
            prefersReducedMotion && "transition-none"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Task status"
          className="absolute left-0 top-full z-20 mt-1 min-w-[9.5rem] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-[var(--card-shadow)]"
        >
          {TASK_STATUS_ORDER.map((option) => {
            const selected = option === status;
            return (
              <li key={option} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => selectStatus(option)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                    "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
                    selected && "bg-muted/60 font-medium"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      option === "todo" && "bg-muted-foreground",
                      option === "in_progress" && "bg-primary",
                      option === "stuck" && "bg-danger",
                      option === "review" && "bg-accent",
                      option === "completed" && "bg-success"
                    )}
                    aria-hidden
                  />
                  {TASK_STATUS_LABELS[option]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {updateError ? (
        <p className="max-w-[12rem] text-[10px] leading-snug text-danger" role="alert">
          {updateError}
        </p>
      ) : null}
    </div>
  );
}
