"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sidebarNavigation } from "@/data/navigation";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import { APP_NAME, AI_ASSISTANT_NAME } from "@/lib/constants";
import {
  DEFAULT_SIDEBAR_SECTIONS,
  readSidebarSections,
  toggleSidebarSection,
  writeSidebarSections,
} from "@/lib/sidebar-storage";
import { cn } from "@/lib/utils";
import type { NavGroup, NavGroupId, NavItem } from "@/types/navigation";

type SidebarProps = {
  isOpen?: boolean;
  onNavigate?: () => void;
};

function NavIcon({ icon }: { icon: NavItem["icon"] }) {
  const paths: Record<NavItem["icon"], string> = {
    dashboard:
      "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    projects:
      "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    tasks:
      "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    calendar:
      "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    team:
      "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
    wellness:
      "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
    breakZone:
      "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    growth:
      "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
    settings:
      "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  };

  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[icon]} />
    </svg>
  );
}

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActiveChild(pathname: string, group: NavGroup): boolean {
  return group.items.some((item) => isActivePath(pathname, item.href));
}

function expandActiveGroups(
  pathname: string,
  state: typeof DEFAULT_SIDEBAR_SECTIONS
) {
  let next = state;
  let changed = false;

  sidebarNavigation.forEach((entry) => {
    if (entry.type !== "group") return;
    if (groupHasActiveChild(pathname, entry.group) && !next[entry.group.id]) {
      if (!changed) {
        next = { ...next };
        changed = true;
      }
      next[entry.group.id] = true;
    }
  });

  return changed ? next : state;
}

type NavLinkProps = {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  nested?: boolean;
};

function NavLink({ item, pathname, onNavigate, nested = false }: NavLinkProps) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
        nested && "py-2 pl-9 pr-3 text-[13px]",
        active
          ? "bg-primary/15 text-sidebar-active"
          : "text-sidebar-foreground hover:bg-[var(--hover-overlay)] hover:text-sidebar-active"
      )}
    >
      {nested ? (
        <NavIcon icon={item.icon} />
      ) : item.emoji ? (
        <span className="text-base leading-none" aria-hidden>
          {item.emoji}
        </span>
      ) : (
        <NavIcon icon={item.icon} />
      )}
      {item.label}
    </Link>
  );
}

type NavGroupSectionProps = {
  group: NavGroup;
  pathname: string;
  expanded: boolean;
  onToggle: (id: NavGroupId) => void;
  onNavigate?: () => void;
  reduceMotion: boolean;
};

function NavGroupSection({
  group,
  pathname,
  expanded,
  onToggle,
  onNavigate,
  reduceMotion,
}: NavGroupSectionProps) {
  const panelId = `sidebar-group-${group.id}`;
  const activeChild = groupHasActiveChild(pathname, group);

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => onToggle(group.id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          activeChild
            ? "text-sidebar-active"
            : "text-sidebar-foreground hover:bg-[var(--hover-overlay)] hover:text-sidebar-active"
        )}
      >
        <span className="text-base leading-none" aria-hidden>
          {group.emoji}
        </span>
        <span className="flex-1">{group.label}</span>
        <svg
          className={cn(
            "h-4 w-4 shrink-0 text-sidebar-foreground transition-transform duration-300",
            expanded && "rotate-180",
            reduceMotion && "transition-none"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        className={cn(
          "sidebar-group-panel grid",
          expanded ? "sidebar-group-panel--open" : "sidebar-group-panel--closed",
          reduceMotion && "sidebar-group-panel--static"
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5 pb-1 pt-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={onNavigate}
                nested
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen = true, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const prefersReducedMotion = usePrefersReducedMotion();
  const storageReady = useStorageHydration();
  const [sections, setSections] = useState(DEFAULT_SIDEBAR_SECTIONS);
  const sidebarLoadedRef = useRef(false);

  useEffect(() => {
    if (!storageReady || sidebarLoadedRef.current) return;
    sidebarLoadedRef.current = true;
    const loaded = readSidebarSections();
    const withActive = expandActiveGroups(pathname, loaded);
    if (withActive !== loaded) {
      writeSidebarSections(withActive);
    }
    setSections(withActive);
  }, [storageReady, pathname]);

  useEffect(() => {
    if (!storageReady || !sidebarLoadedRef.current) return;
    setSections((current) => {
      const withActive = expandActiveGroups(pathname, current);
      if (withActive === current) return current;
      writeSidebarSections(withActive);
      return withActive;
    });
  }, [pathname, storageReady]);

  const handleToggle = useCallback((id: NavGroupId) => {
    setSections((current) => {
      const next = toggleSidebarSection(current, id);
      writeSidebarSections(next);
      return next;
    });
  }, []);

  const navEntries = useMemo(() => sidebarNavigation, []);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:h-dvh lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-border/20 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-sidebar-active">{APP_NAME}</p>
          <p className="text-[10px] text-sidebar-foreground">
            Powered by {AI_ASSISTANT_NAME}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Main">
        {navEntries.map((entry) =>
          entry.type === "link" ? (
            <NavLink
              key={entry.item.href}
              item={entry.item}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ) : (
            <NavGroupSection
              key={entry.group.id}
              group={entry.group}
              pathname={pathname}
              expanded={sections[entry.group.id]}
              onToggle={handleToggle}
              onNavigate={onNavigate}
              reduceMotion={prefersReducedMotion}
            />
          )
        )}
      </nav>

      <div className="border-t border-border/20 p-4">
        <div className="rounded-lg bg-[var(--hover-overlay)] p-3">
          <p className="text-xs font-medium text-sidebar-active">Need help?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground">
            Ask {AI_ASSISTANT_NAME} for project insights and task suggestions.
          </p>
        </div>
      </div>
    </aside>
  );
}
