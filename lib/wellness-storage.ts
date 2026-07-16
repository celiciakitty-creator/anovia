import type { WellnessData } from "@/types/wellness";
import { isValidExternalUrl } from "@/lib/focus-music-utils";
import type { FocusSoundId } from "@/types/wellness";

export const WELLNESS_STORAGE_KEY = "anovia-wellness";

export const DEFAULT_WELLNESS_DATA: WellnessData = {
  checkIn: {
    mood: null,
    date: null,
  },
  focusTimer: {
    presetMinutes: 25,
    sessionsCompletedToday: 0,
    lastSessionDate: null,
    activeSessionStartedAt: null,
  },
  reminders: {
    eyeBreak: { enabled: false, intervalMinutes: 30 },
    stretch: { enabled: false, intervalMinutes: 45 },
    hydration: { enabled: false, intervalMinutes: 60 },
  },
  hydration: {
    count: 0,
    date: "",
  },
  quoteIndex: 0,
  focusMusic: {
    preferredSound: null,
    userPlaylistUrl: null,
  },
};

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeFocusSoundId(value: unknown): FocusSoundId | null {
  const allowed: FocusSoundId[] = [
    "lofi_focus",
    "classical_focus",
    "nature_sounds",
    "white_noise",
    "deep_work",
    "user_playlist",
  ];
  return typeof value === "string" && allowed.includes(value as FocusSoundId)
    ? (value as FocusSoundId)
    : null;
}

function normalizeWellness(data: Partial<WellnessData>): WellnessData {
  const today = toDateString(new Date());
  const storedHydrationDate =
    typeof data.hydration?.date === "string" ? data.hydration.date : "";
  const hydrationCount =
    storedHydrationDate === today && typeof data.hydration?.count === "number"
      ? Math.max(0, Math.min(data.hydration.count, 20))
      : 0;

  const focusDate = data.focusTimer?.lastSessionDate ?? null;
  const sessionsToday =
    focusDate === today && typeof data.focusTimer?.sessionsCompletedToday === "number"
      ? data.focusTimer.sessionsCompletedToday
      : 0;

  const preset = data.focusTimer?.presetMinutes;
  const presetMinutes =
    preset === 25 || preset === 45 || preset === 60 ? preset : 25;

  let activeSessionStartedAt =
    typeof data.focusTimer?.activeSessionStartedAt === "string"
      ? data.focusTimer.activeSessionStartedAt
      : null;

  if (activeSessionStartedAt) {
    const elapsedMs = Date.now() - new Date(activeSessionStartedAt).getTime();
    const maxSessionMs = presetMinutes * 60 * 1000 + 10 * 60 * 1000;
    if (elapsedMs > maxSessionMs) {
      activeSessionStartedAt = null;
    }
  }

  return {
    checkIn: {
      mood: data.checkIn?.mood ?? null,
      date: data.checkIn?.date ?? null,
    },
    focusTimer: {
      presetMinutes,
      sessionsCompletedToday: sessionsToday,
      lastSessionDate: focusDate === today ? focusDate : null,
      activeSessionStartedAt,
    },
    reminders: {
      eyeBreak: {
        enabled: Boolean(data.reminders?.eyeBreak?.enabled),
        intervalMinutes: normalizeInterval(data.reminders?.eyeBreak?.intervalMinutes, 30),
      },
      stretch: {
        enabled: Boolean(data.reminders?.stretch?.enabled),
        intervalMinutes: normalizeInterval(data.reminders?.stretch?.intervalMinutes, 45),
      },
      hydration: {
        enabled: Boolean(data.reminders?.hydration?.enabled),
        intervalMinutes: normalizeInterval(data.reminders?.hydration?.intervalMinutes, 60),
      },
    },
    hydration: {
      count: hydrationCount,
      date: today,
    },
    quoteIndex:
      typeof data.quoteIndex === "number" && data.quoteIndex >= 0
        ? data.quoteIndex % 1000
        : 0,
    focusMusic: {
      preferredSound: normalizeFocusSoundId(data.focusMusic?.preferredSound),
      userPlaylistUrl:
        typeof data.focusMusic?.userPlaylistUrl === "string" &&
        isValidExternalUrl(data.focusMusic.userPlaylistUrl)
          ? data.focusMusic.userPlaylistUrl.trim()
          : null,
    },
  };
}

function normalizeInterval(value: unknown, fallback: number): number {
  const allowed = [15, 30, 45, 60];
  return typeof value === "number" && allowed.includes(value) ? value : fallback;
}

export function readWellness(): WellnessData {
  if (typeof window === "undefined") {
    return DEFAULT_WELLNESS_DATA;
  }

  try {
    const raw = localStorage.getItem(WELLNESS_STORAGE_KEY);
    if (!raw) {
      const initial = normalizeWellness(DEFAULT_WELLNESS_DATA);
      writeWellness(initial);
      return initial;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      writeWellness(DEFAULT_WELLNESS_DATA);
      return normalizeWellness(DEFAULT_WELLNESS_DATA);
    }

    const normalized = normalizeWellness(parsed as Partial<WellnessData>);
    writeWellness(normalized);
    return normalized;
  } catch {
    writeWellness(DEFAULT_WELLNESS_DATA);
    return normalizeWellness(DEFAULT_WELLNESS_DATA);
  }
}

export function writeWellness(data: WellnessData): void {
  localStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(data));
}

export function getTodayDateString(reference = new Date()): string {
  return toDateString(reference);
}
