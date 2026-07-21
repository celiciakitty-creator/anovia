import type { NavEntry } from "@/types/navigation";

export const sidebarNavigation: NavEntry[] = [
  {
    type: "link",
    item: {
      label: "Dashboard",
      href: "/",
      icon: "dashboard",
      emoji: "🏠",
    },
  },
  {
    type: "group",
    group: {
      id: "workspace",
      label: "Workspace",
      emoji: "📁",
      items: [
        { label: "Projects", href: "/projects", icon: "projects" },
        { label: "Tasks", href: "/tasks", icon: "tasks" },
        { label: "Calendar", href: "/calendar", icon: "calendar" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "team",
      label: "Team",
      emoji: "👥",
      items: [
        { label: "Directory", href: "/team", icon: "team" },
        { label: "Leaderboard", href: "/leaderboard", icon: "leaderboard" },
      ],
    },
  },
  {
    type: "group",
    group: {
      id: "wellnessHub",
      label: "Wellness Hub",
      emoji: "🧠",
      items: [
        { label: "Wellness", href: "/wellness", icon: "wellness" },
        { label: "Break Zone", href: "/break-zone", icon: "breakZone" },
      ],
    },
  },
  {
    type: "link",
    item: {
      label: "Growth",
      href: "/growth",
      icon: "growth",
      emoji: "🌱",
    },
  },
  {
    type: "link",
    item: {
      label: "Settings",
      href: "/settings",
      icon: "settings",
      emoji: "⚙️",
    },
  },
];

/** Flat list of all sidebar routes for utilities. */
export function getAllNavItems() {
  return sidebarNavigation.flatMap((entry) =>
    entry.type === "link" ? [entry.item] : entry.group.items
  );
}
