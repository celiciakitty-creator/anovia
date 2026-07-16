"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_CUSTOM_APPEARANCE,
  DEFAULT_PRESET,
  type AppearanceColorToken,
} from "@/lib/theme-presets";
import {
  applyThemeToDocument,
  readThemePreferences,
  writeThemePreferences,
} from "@/lib/theme-storage";
import { getSystemTheme, SYSTEM_THEME_QUERY } from "@/lib/theme-utils";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import type {
  ColorPreset,
  CustomAppearanceColors,
  ResolvedTheme,
  ThemeMode,
  ThemePreferences,
} from "@/types/theme";

type ThemeContextValue = {
  /** Stored user preference: light, dark, or system. */
  mode: ThemeMode;
  /** Active theme after resolving system preference. */
  resolvedMode: ResolvedTheme;
  preset: ColorPreset;
  customColors: CustomAppearanceColors;
  isHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  setPreset: (preset: ColorPreset) => void;
  setCustomColor: (token: AppearanceColorToken, value: string) => void;
  resetToAnoviaDefault: () => void;
  /** @deprecated Use resetToAnoviaDefault */
  resetCustomColors: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const SERVER_DEFAULT_PREFERENCES: ThemePreferences = {
  mode: "system",
  preset: DEFAULT_PRESET,
  customColors: DEFAULT_CUSTOM_APPEARANCE,
};

function persistAndApply(preferences: ThemePreferences) {
  writeThemePreferences(preferences);
  applyThemeToDocument(preferences);
}

function subscribeSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia(SYSTEM_THEME_QUERY);
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const storageReady = useStorageHydration();
  const [preferences, setPreferences] =
    useState<ThemePreferences>(SERVER_DEFAULT_PREFERENCES);
  const [themeLoaded, setThemeLoaded] = useState(false);
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemTheme,
    () => "light" as ResolvedTheme
  );

  useEffect(() => {
    if (!storageReady || themeLoaded) return;
    const stored = readThemePreferences();
    queueMicrotask(() => {
      setPreferences(stored);
      applyThemeToDocument(stored);
      setThemeLoaded(true);
    });
  }, [storageReady, themeLoaded]);

  const resolvedMode = useMemo(() => {
    if (preferences.mode === "system") return systemTheme;
    return preferences.mode;
  }, [preferences.mode, systemTheme]);

  useEffect(() => {
    if (!themeLoaded) return;
    applyThemeToDocument(preferences);
  }, [preferences, systemTheme, themeLoaded]);

  const setMode = useCallback((mode: ThemeMode) => {
    setPreferences((current) => {
      const next = { ...current, mode };
      persistAndApply(next);
      return next;
    });
  }, []);

  const setPreset = useCallback((preset: ColorPreset) => {
    setPreferences((current) => {
      const next = { ...current, preset };
      persistAndApply(next);
      return next;
    });
  }, []);

  const setCustomColor = useCallback(
    (token: AppearanceColorToken, value: string) => {
      setPreferences((current) => {
        const next = {
          ...current,
          preset: "custom" as const,
          customColors: { ...current.customColors, [token]: value },
        };
        persistAndApply(next);
        return next;
      });
    },
    []
  );

  const resetToAnoviaDefault = useCallback(() => {
    setPreferences((current) => {
      const next = {
        ...current,
        preset: DEFAULT_PRESET,
        customColors: DEFAULT_CUSTOM_APPEARANCE,
      };
      persistAndApply(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      mode: preferences.mode,
      resolvedMode,
      preset: preferences.preset,
      customColors: preferences.customColors,
      isHydrated: themeLoaded,
      setMode,
      setPreset,
      setCustomColor,
      resetToAnoviaDefault,
      resetCustomColors: resetToAnoviaDefault,
    }),
    [
      preferences,
      resolvedMode,
      themeLoaded,
      setMode,
      setPreset,
      setCustomColor,
      resetToAnoviaDefault,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
