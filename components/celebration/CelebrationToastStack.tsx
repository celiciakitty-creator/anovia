"use client";

import { cn } from "@/lib/utils";

export type CelebrationToastItem = {
  id: string;
  title: string;
  message: string;
  variant: "task" | "project";
};

type CelebrationToastStackProps = {
  toasts: CelebrationToastItem[];
};

export function CelebrationToastStack({ toasts }: CelebrationToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[110] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "celebration-toast rounded-xl border border-border bg-card px-4 py-3 shadow-lg",
            toast.variant === "project" && "celebration-toast--project"
          )}
        >
          <p className="text-sm font-semibold text-foreground">{toast.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
