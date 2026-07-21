"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type DashboardNavCardProps = {
  href: string;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
};

/** Overlay link pattern for dashboard cards with optional nested interactive controls. */
export function DashboardNavCard({
  href,
  ariaLabel,
  children,
  className,
}: DashboardNavCardProps) {
  return (
    <div className={cn("group relative h-full", className)}>
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(
          "absolute inset-0 z-0 rounded-xl",
          "transition-colors hover:bg-muted/25",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      />
      <div className="relative z-10 h-full pointer-events-none [&_[data-dashboard-interactive]]:pointer-events-auto [&_[data-dashboard-interactive]]:relative [&_[data-dashboard-interactive]]:z-20">
        {children}
      </div>
    </div>
  );
}

type DashboardMetricLinkProps = {
  href: string;
  label: string;
  value: React.ReactNode;
  className?: string;
};

/** Compact stat link for summary metrics (e.g. welcome banner). */
export function DashboardMetricLink({
  href,
  label,
  value,
  className,
}: DashboardMetricLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors",
        "hover:bg-primary-foreground/10",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        className
      )}
    >
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-primary-foreground/70">{label}</p>
    </Link>
  );
}
