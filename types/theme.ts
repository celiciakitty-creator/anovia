/** Semantic color tokens exposed by the design system. */
export type ThemeColorToken =
  | "background"
  | "foreground"
  | "card"
  | "primary"
  | "secondary"
  | "accent"
  | "border"
  | "muted"
  | "success"
  | "warning"
  | "danger";

/** User-selected appearance mode (stored in localStorage). */
export type ThemeMode = "light" | "dark" | "system";

/** Resolved mode applied to the document and CSS variables. */
export type ResolvedTheme = "light" | "dark";

export type ColorPreset =
  | "anovia"
  | "ocean"
  | "lavender"
  | "forest"
  | "rose"
  | "kawaiiCozy"
  | "custom";

/** User-defined primary and accent overrides when preset is custom. */
export type CustomAppearanceColors = {
  primary: string;
  accent: string;
};

export type ThemePreferences = {
  mode: ThemeMode;
  preset: ColorPreset;
  customColors: CustomAppearanceColors;
};

/** @deprecated Use CustomAppearanceColors */
export type CustomThemeColors = CustomAppearanceColors;
