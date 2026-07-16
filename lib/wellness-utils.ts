import { WELLNESS_QUOTES } from "@/data/wellness-quotes";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { getKizunaFocusMusicMessage } from "@/lib/focus-music-utils";
import { getTodayDateString } from "@/lib/wellness-storage";
import type { Mood, WellnessData } from "@/types/wellness";
import { HYDRATION_GOAL } from "@/types/wellness";

const MOOD_MESSAGES: Record<Mood, string> = {
  great:
    "Wonderful energy today. Channel it gently — even great days benefit from a pause.",
  good:
    "Glad you're in a good place. A steady pace will help you keep that feeling.",
  okay:
    "Okay is a valid place to be. Pick one small win and let that be enough for now.",
  stressed:
    "Stress happens. Try a slow breath or a short break — you do not have to push through alone.",
  tired:
    "Rest is productive too. Be kind to yourself and protect a little recovery time today.",
};

export function getMoodMessage(mood: Mood): string {
  return MOOD_MESSAGES[mood];
}

export function getQuote(index: number) {
  const safeIndex =
    ((index % WELLNESS_QUOTES.length) + WELLNESS_QUOTES.length) %
    WELLNESS_QUOTES.length;
  return WELLNESS_QUOTES[safeIndex];
}

export function getNextQuoteIndex(current: number): number {
  return (current + 1) % WELLNESS_QUOTES.length;
}

export function getRandomQuoteIndex(): number {
  return Math.floor(Math.random() * WELLNESS_QUOTES.length);
}

export function formatTimerDisplay(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isCheckInToday(data: WellnessData, reference = new Date()): boolean {
  return data.checkIn.date === getTodayDateString(reference);
}

export function getFocusSessionsToday(data: WellnessData, reference = new Date()): number {
  const today = getTodayDateString(reference);
  if (data.focusTimer.lastSessionDate !== today) return 0;
  return data.focusTimer.sessionsCompletedToday;
}

/** Build a supportive Kizuna wellness summary from current wellness state. */
export function generateWellnessSummary(
  data: WellnessData,
  reference = new Date()
): string {
  const today = getTodayDateString(reference);
  const sessions = getFocusSessionsToday(data, reference);
  const parts: string[] = [];

  if (sessions > 0) {
    parts.push(
      sessions === 1
        ? "You've completed one focus session today."
        : `You've completed ${sessions} focus sessions today.`
    );
  }

  if (data.checkIn.date === today && data.checkIn.mood) {
    if (data.checkIn.mood === "stressed" || data.checkIn.mood === "tired") {
      parts.push("Consider a gentle break when you have a moment.");
    } else if (data.checkIn.mood === "great" || data.checkIn.mood === "good") {
      parts.push("Your energy looks positive — keep honoring your rhythm.");
    }
  }

  if (data.reminders.eyeBreak.enabled && sessions >= 1) {
    parts.push("A short eye break may help you stay sharp.");
  } else if (data.reminders.stretch.enabled) {
    parts.push("A brief stretch could feel refreshing right now.");
  } else if (data.hydration.date === today && data.hydration.count < HYDRATION_GOAL / 2) {
    parts.push("Sipping some water might be a nice reset.");
  }

  const focusMusicMessage = getKizunaFocusMusicMessage(
    data.focusMusic.preferredSound
  );
  if (focusMusicMessage) {
    parts.push(focusMusicMessage);
  }

  if (parts.length === 0) {
    return `${AI_ASSISTANT_NAME} is here when you need a calm moment. Explore a focus session or check in with yourself — no pressure.`;
  }

  return parts.join(" ");
}
