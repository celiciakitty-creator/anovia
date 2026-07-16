import { THEME_STORAGE_KEYS, DEFAULT_PRESET } from "@/lib/theme-presets";

const VALID_PRESETS = [
  "anovia",
  "ocean",
  "lavender",
  "forest",
  "rose",
  "kawaiiCozy",
  "custom",
] as const;

/** Inline script applied before first paint to avoid theme flash. */
export const themeInitScript = `
  (function () {
    try {
      var mode = localStorage.getItem("${THEME_STORAGE_KEYS.mode}") || "system";
      var presetRaw =
        localStorage.getItem("${THEME_STORAGE_KEYS.preset}") || "${DEFAULT_PRESET}";
      var legacyMap = {
        indigo: "anovia",
        emerald: "forest",
        violet: "lavender",
        amber: "ocean",
      };
      var preset = legacyMap[presetRaw] || presetRaw;
      var validPresets = ${JSON.stringify(VALID_PRESETS)};
      if (validPresets.indexOf(preset) === -1) {
        preset = "${DEFAULT_PRESET}";
      }
      var resolved = mode;
      if (mode === "system") {
        resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      }
      var root = document.documentElement;
      root.setAttribute("data-theme", resolved);
      root.setAttribute("data-theme-mode", mode);
      root.setAttribute("data-color-preset", preset);
      root.style.colorScheme = resolved;
      if (preset === "custom") {
        var custom = localStorage.getItem("${THEME_STORAGE_KEYS.custom}");
        if (custom) {
          var colors = JSON.parse(custom);
          if (colors.primary) root.style.setProperty("--primary", colors.primary);
          if (colors.accent) root.style.setProperty("--accent", colors.accent);
        }
      }
    } catch (e) {}
  })();
`;
