"use client";

import { UserMenu } from "@/components/auth";
import { Button } from "@/components/ui";
import { NotificationsBell } from "@/components/notifications";
import { AskKizunaButton } from "@/components/kizuna";
import { ThemeToggle } from "@/components/theme";
import { NewMenu } from "@/components/layout/NewMenu";
import { useScrollY } from "@/hooks/useScrollY";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

type TopNavbarProps = {
  onMenuToggle?: () => void;
  subtitle?: string;
  scrollRoot?: HTMLElement | null;
};

export function TopNavbar({
  onMenuToggle,
  subtitle = "Dashboard overview",
  scrollRoot = null,
}: TopNavbarProps) {
  const hasScrolled = useScrollY(12, scrollRoot);

  return (
    <header
      className={cn(
        "navbar-scroll sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-card/80 px-4 backdrop-blur-sm sm:px-6",
        hasScrolled && "is-scrolled border-border/60 bg-card"
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </Button>

        <div className="hidden min-w-0 sm:block">
          <p
            className={cn(
              "truncate text-sm font-medium text-foreground transition-[font-size] duration-300",
              hasScrolled && "text-[13px]"
            )}
          >
            {APP_NAME}
          </p>
          <p className="navbar-scroll__subtitle mt-0.5 truncate text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3 sm:max-w-md sm:flex-none">
        <label className="relative hidden flex-1 sm:block">
          <span className="sr-only">Search</span>
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            placeholder="Search projects, tasks..."
            className="h-9 w-full rounded-lg border border-border bg-[var(--input-background)] pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </label>

        <ThemeToggle />

        <AskKizunaButton className="shrink-0 sm:hidden" showLabel={false} />
        <AskKizunaButton className="hidden shrink-0 sm:inline-flex" />

        <NotificationsBell />

        <NewMenu />

        <UserMenu />
      </div>
    </header>
  );
}
