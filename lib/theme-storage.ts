import {
  DEFAULT_CUSTOM_APPEARANCE,
  APPEARANCE_COLOR_TOKENS,
  DEFAULT_PRESET,
  THEME_STORAGE_KEYS,
  isThemeMode,
  normalizeColorPreset,
  parseCustomAppearance,
} from "@/lib/theme-presets";
import { resolveThemeMode } from "@/lib/theme-utils";
import type { ThemePreferences } from "@/types/theme";

export function readThemePreferences(): ThemePreferences {
  if (typeof window === "undefined") {
    return {
      mode: "system",
      preset: DEFAULT_PRESET,
      customColors: DEFAULT_CUSTOM_APPEARANCE,
    };
  }

  try {
    const modeRaw = localStorage.getItem(THEME_STORAGE_KEYS.mode);
    const presetRaw = localStorage.getItem(THEME_STORAGE_KEYS.preset);
    const customRaw = localStorage.getItem(THEME_STORAGE_KEYS.custom);

    const mode = modeRaw && isThemeMode(modeRaw) ? modeRaw : "system";
    const preset = presetRaw ? normalizeColorPreset(presetRaw) : DEFAULT_PRESET;
    const customColors = parseCustomAppearance(customRaw);

    return { mode, preset, customColors };
  } catch {
    return {
      mode: "system",
      preset: DEFAULT_PRESET,
      customColors: DEFAULT_CUSTOM_APPEARANCE,
    };
  }
}

export function writeThemePreferences(preferences: ThemePreferences): void {
  localStorage.setItem(THEME_STORAGE_KEYS.mode, preferences.mode);
  localStorage.setItem(THEME_STORAGE_KEYS.preset, preferences.preset);
  localStorage.setItem(
    THEME_STORAGE_KEYS.custom,
    JSON.stringify(preferences.customColors)
  );
}

export function applyThemeToDocument(preferences: ThemePreferences): void {
  const root = document.documentElement;
  const resolved = resolveThemeMode(preferences.mode);

  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-mode", preferences.mode);
  root.setAttribute("data-color-preset", preferences.preset);
  root.style.colorScheme = resolved;

  APPEARANCE_COLOR_TOKENS.forEach((token) => {
    root.style.removeProperty(`--${token}`);
  });

  if (preferences.preset === "custom") {
    root.style.setProperty("--primary", preferences.customColors.primary);
    root.style.setProperty("--accent", preferences.customColors.accent);
  }
}
