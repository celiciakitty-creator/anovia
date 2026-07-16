import { FUN_FACTS } from "@/data/break-zone-facts";
import { createDefaultTriviaSession, normalizeTriviaSession } from "@/lib/break-zone-trivia-utils";
import type { BreakPresetMinutes, BreakZoneData } from "@/types/break-zone";

export const BREAK_ZONE_STORAGE_KEY = "anovia-break-zone";

export const DEFAULT_BREAK_ZONE_DATA: BreakZoneData = {
  reactionGame: {
    bestMs: null,
  },
  dailyFact: {
    date: "",
    factIndex: 0,
  },
  breakTimer: {
    presetMinutes: 5,
  },
  trivia: createDefaultTriviaSession(),
};

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hashDate(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getDailyFactIndexForDate(
  date: string,
  factCount = FUN_FACTS.length
): number {
  return hashDate(date) % factCount;
}

function normalizePreset(value: unknown): BreakPresetMinutes {
  return value === 2 || value === 5 || value === 10 ? value : 5;
}

function normalizeBreakZone(data: Partial<BreakZoneData>): BreakZoneData {
  const today = toDateString(new Date());
  const storedDate =
    typeof data.dailyFact?.date === "string" ? data.dailyFact.date : "";
  const factIndex =
    storedDate === today && typeof data.dailyFact?.factIndex === "number"
      ? data.dailyFact.factIndex % FUN_FACTS.length
      : getDailyFactIndexForDate(today);

  const bestMs = data.reactionGame?.bestMs;
  const normalizedBest =
    typeof bestMs === "number" && bestMs > 0 ? Math.round(bestMs) : null;

  return {
    reactionGame: {
      bestMs: normalizedBest,
    },
    dailyFact: {
      date: today,
      factIndex,
    },
    breakTimer: {
      presetMinutes: normalizePreset(data.breakTimer?.presetMinutes),
    },
    trivia: normalizeTriviaSession(data.trivia),
  };
}

export function readBreakZone(): BreakZoneData {
  if (typeof window === "undefined") {
    return DEFAULT_BREAK_ZONE_DATA;
  }

  try {
    const raw = localStorage.getItem(BREAK_ZONE_STORAGE_KEY);
    if (!raw) {
      const initial = normalizeBreakZone(DEFAULT_BREAK_ZONE_DATA);
      writeBreakZone(initial);
      return initial;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      const fallback = normalizeBreakZone(DEFAULT_BREAK_ZONE_DATA);
      writeBreakZone(fallback);
      return fallback;
    }

    const normalized = normalizeBreakZone(parsed as Partial<BreakZoneData>);
    writeBreakZone(normalized);
    return normalized;
  } catch {
    const fallback = normalizeBreakZone(DEFAULT_BREAK_ZONE_DATA);
    writeBreakZone(fallback);
    return fallback;
  }
}

export function writeBreakZone(data: BreakZoneData): void {
  localStorage.setItem(BREAK_ZONE_STORAGE_KEY, JSON.stringify(data));
}

export function getTodayDateString(reference = new Date()): string {
  return toDateString(reference);
}

export function formatTimerDisplay(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getFunFact(index: number): string {
  const safeIndex =
    ((index % FUN_FACTS.length) + FUN_FACTS.length) % FUN_FACTS.length;
  return FUN_FACTS[safeIndex];
}

export function getNextFactIndex(current: number): number {
  return (current + 1) % FUN_FACTS.length;
}
