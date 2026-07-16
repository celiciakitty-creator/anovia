export type NavIcon =
  | "dashboard"
  | "projects"
  | "tasks"
  | "calendar"
  | "team"
  | "wellness"
  | "breakZone"
  | "growth"
  | "settings";

export type NavGroupId = "workspace" | "wellnessHub";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  emoji?: string;
};

export type NavGroup = {
  id: NavGroupId;
  label: string;
  emoji: string;
  items: NavItem[];
};

export type NavEntry =
  | { type: "link"; item: NavItem }
  | { type: "group"; group: NavGroup };

export type SidebarSectionState = Record<NavGroupId, boolean>;
