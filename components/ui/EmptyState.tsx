import Link from "next/link";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  kizunaMessage?: string;
  emoji?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  compact?: boolean;
  className?: string;
};

export function EmptyState({
  title,
  description,
  kizunaMessage,
  emoji,
  actionLabel,
  onAction,
  actionHref,
  compact = false,
  className,
}: EmptyStateProps) {
  const showAction = Boolean(actionLabel && (onAction || actionHref));

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-center",
        compact ? "px-4 py-6" : "px-6 py-12",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-muted text-muted-foreground",
          compact ? "h-10 w-10 text-lg" : "h-12 w-12"
        )}
        aria-hidden
      >
        {emoji ? (
          <span className="leading-none">{emoji}</span>
        ) : (
          <svg
            className={cn(compact ? "h-5 w-5" : "h-6 w-6")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        )}
      </div>
      <h3
        className={cn(
          "font-semibold text-foreground",
          compact ? "mt-3 text-sm" : "mt-4 text-sm"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "max-w-sm text-muted-foreground",
          compact ? "mt-1 text-xs leading-relaxed" : "mt-1 text-sm"
        )}
      >
        {description}
      </p>
      {kizunaMessage ? (
        <p
          className={cn(
            "max-w-sm rounded-lg border border-primary/20 bg-primary/5 text-left text-foreground",
            compact ? "mt-3 px-3 py-2 text-[11px] leading-relaxed" : "mt-4 px-3 py-2.5 text-xs leading-relaxed"
          )}
        >
          <span className="font-medium text-primary">{AI_ASSISTANT_NAME} · </span>
          {kizunaMessage}
        </p>
      ) : null}
      {showAction ? (
        actionHref ? (
          <Link
            data-dashboard-interactive
            href={actionHref}
            className="mt-4 inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {actionLabel}
          </Link>
        ) : (
          <Button
            data-dashboard-interactive
            className="mt-4"
            size="sm"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        )
      ) : null}
    </div>
  );
}
