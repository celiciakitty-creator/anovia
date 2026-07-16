import type { ColorPreset, CustomAppearanceColors, ThemeMode } from "@/types/theme";

export const APPEARANCE_COLOR_TOKENS = ["primary", "accent"] as const;

export type AppearanceColorToken = (typeof APPEARANCE_COLOR_TOKENS)[number];

export const DEFAULT_PRESET: ColorPreset = "anovia";

export const COLOR_PRESET_OPTIONS: {
  id: Exclude<ColorPreset, "custom">;
  label: string;
  description: string;
  swatch: string;
}[] = [
  {
    id: "anovia",
    label: "Anovia",
    description: "Signature indigo brand palette",
    swatch: "#4f46e5",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Calm blues for focused work",
    swatch: "#0284c7",
  },
  {
    id: "lavender",
    label: "Lavender",
    description: "Soft violet highlights",
    swatch: "#7c3aed",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Natural greens for balance",
    swatch: "#059669",
  },
  {
    id: "rose",
    label: "Rose",
    description: "Warm rose accents",
    swatch: "#e11d48",
  },
  {
    id: "kawaiiCozy",
    label: "Kawaii Cozy",
    description: "Soft blush, lavender, cream, and mint",
    swatch: "#e8a0b4",
  },
];

/** Default custom colors — matches the Anovia preset in light mode. */
export const DEFAULT_CUSTOM_APPEARANCE: CustomAppearanceColors = {
  primary: "#4f46e5",
  accent: "#818cf8",
};

/** @deprecated Use DEFAULT_CUSTOM_APPEARANCE */
export const DEFAULT_CUSTOM_THEME = DEFAULT_CUSTOM_APPEARANCE;

export const THEME_STORAGE_KEYS = {
  mode: "anovia-theme-mode",
  preset: "anovia-color-preset",
  custom: "anovia-custom-theme",
} as const;

const LEGACY_PRESET_MAP: Record<string, ColorPreset> = {
  indigo: "anovia",
  emerald: "forest",
  violet: "lavender",
  amber: "ocean",
};

const VALID_PRESETS = new Set<string>([
  "anovia",
  "ocean",
  "lavender",
  "forest",
  "rose",
  "kawaiiCozy",
  "custom",
]);

export function normalizeColorPreset(value: string): ColorPreset {
  if (VALID_PRESETS.has(value)) return value as ColorPreset;
  return LEGACY_PRESET_MAP[value] ?? DEFAULT_PRESET;
}

export function isColorPreset(value: string): value is ColorPreset {
  return VALID_PRESETS.has(value) || value in LEGACY_PRESET_MAP;
}

export function isThemeMode(value: string): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export function isAppearanceColorToken(
  value: string
): value is AppearanceColorToken {
  return value === "primary" || value === "accent";
}

export function parseCustomAppearance(raw: string | null): CustomAppearanceColors {
  if (!raw) return DEFAULT_CUSTOM_APPEARANCE;

  try {
    const parsed = JSON.parse(raw) as Partial<
      CustomAppearanceColors & Record<string, string>
    >;
    return {
      primary: parsed.primary ?? DEFAULT_CUSTOM_APPEARANCE.primary,
      accent: parsed.accent ?? DEFAULT_CUSTOM_APPEARANCE.accent,
    };
  } catch {
    return DEFAULT_CUSTOM_APPEARANCE;
  }
}
