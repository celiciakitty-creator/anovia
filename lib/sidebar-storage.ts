import type { NavGroupId, SidebarSectionState } from "@/types/navigation";

export const SIDEBAR_STORAGE_KEY = "anovia-sidebar-sections";

export const DEFAULT_SIDEBAR_SECTIONS: SidebarSectionState = {
  workspace: true,
  wellnessHub: true,
};

export function readSidebarSections(): SidebarSectionState {
  if (typeof window === "undefined") {
    return DEFAULT_SIDEBAR_SECTIONS;
  }

  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (!raw) return DEFAULT_SIDEBAR_SECTIONS;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_SIDEBAR_SECTIONS;
    }

    const data = parsed as Partial<SidebarSectionState>;
    return {
      workspace:
        typeof data.workspace === "boolean"
          ? data.workspace
          : DEFAULT_SIDEBAR_SECTIONS.workspace,
      wellnessHub:
        typeof data.wellnessHub === "boolean"
          ? data.wellnessHub
          : DEFAULT_SIDEBAR_SECTIONS.wellnessHub,
    };
  } catch {
    return DEFAULT_SIDEBAR_SECTIONS;
  }
}

export function writeSidebarSections(state: SidebarSectionState): void {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(state));
}

export function toggleSidebarSection(
  state: SidebarSectionState,
  id: NavGroupId
): SidebarSectionState {
  return {
    ...state,
    [id]: !state[id],
  };
}
