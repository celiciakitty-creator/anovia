import type { ResolvedTheme, ThemeMode } from "@/types/theme";

export const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

/** Read the OS color-scheme preference. */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia(SYSTEM_THEME_QUERY).matches ? "dark" : "light";
}

/** Map a stored mode (including system) to the theme applied to the document. */
export function resolveThemeMode(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return getSystemTheme();
  return mode;
}
