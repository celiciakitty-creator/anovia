"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DEFAULT_WELLNESS_DATA,
  getTodayDateString,
  readWellness,
  writeWellness,
} from "@/lib/wellness-storage";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import { generateWellnessSummary } from "@/lib/wellness-utils";
import type {
  FocusPresetMinutes,
  FocusSoundId,
  Mood,
  ReminderPreference,
  ReminderType,
  WellnessData,
} from "@/types/wellness";
import { REMINDER_LABELS } from "@/types/wellness";

type ActiveReminder = {
  type: ReminderType;
  message: string;
};

type WellnessContextValue = {
  data: WellnessData;
  isLoaded: boolean;
  summary: string;
  activeReminder: ActiveReminder | null;
  setMood: (mood: Mood) => void;
  setFocusPreset: (minutes: FocusPresetMinutes) => void;
  recordFocusSession: () => void;
  updateReminder: (type: ReminderType, preference: Partial<ReminderPreference>) => void;
  setHydrationCount: (count: number) => void;
  adjustHydration: (delta: number) => void;
  setQuoteIndex: (index: number) => void;
  dismissReminder: () => void;
  setActiveFocusSession: (startedAt: string | null) => void;
  setPreferredFocusSound: (sound: FocusSoundId | null) => void;
  setUserPlaylistUrl: (url: string | null) => void;
};

const WellnessContext = createContext<WellnessContextValue | null>(null);

function persist(data: WellnessData) {
  writeWellness(data);
}

export function WellnessProvider({ children }: { children: React.ReactNode }) {
  const storageReady = useStorageHydration();
  const [data, setData] = useState<WellnessData>(DEFAULT_WELLNESS_DATA);
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);
  const wellnessLoadedRef = useRef(false);

  useEffect(() => {
    if (!storageReady || wellnessLoadedRef.current) return;
    wellnessLoadedRef.current = true;
    setData(readWellness());
  }, [storageReady]);

  const update = useCallback((updater: (current: WellnessData) => WellnessData) => {
    setData((current) => {
      const next = updater(current);
      persist(next);
      return next;
    });
  }, []);

  const setMood = useCallback(
    (mood: Mood) => {
      const today = getTodayDateString();
      update((current) => ({
        ...current,
        checkIn: { mood, date: today },
      }));
    },
    [update]
  );

  const setFocusPreset = useCallback(
    (minutes: FocusPresetMinutes) => {
      update((current) => ({
        ...current,
        focusTimer: { ...current.focusTimer, presetMinutes: minutes },
      }));
    },
    [update]
  );

  const recordFocusSession = useCallback(() => {
    const today = getTodayDateString();
    update((current) => ({
      ...current,
      focusTimer: {
        ...current.focusTimer,
        lastSessionDate: today,
        sessionsCompletedToday:
          current.focusTimer.lastSessionDate === today
            ? current.focusTimer.sessionsCompletedToday + 1
            : 1,
      },
    }));
  }, [update]);

  const updateReminder = useCallback(
    (type: ReminderType, preference: Partial<ReminderPreference>) => {
      update((current) => ({
        ...current,
        reminders: {
          ...current.reminders,
          [type]: { ...current.reminders[type], ...preference },
        },
      }));
    },
    [update]
  );

  const setHydrationCount = useCallback(
    (count: number) => {
      const today = getTodayDateString();
      update((current) => ({
        ...current,
        hydration: {
          count: Math.max(0, Math.min(count, 20)),
          date: today,
        },
      }));
    },
    [update]
  );

  const adjustHydration = useCallback(
    (delta: number) => {
      const today = getTodayDateString();
      update((current) => {
        const base =
          current.hydration.date === today ? current.hydration.count : 0;
        return {
          ...current,
          hydration: {
            count: Math.max(0, Math.min(base + delta, 20)),
            date: today,
          },
        };
      });
    },
    [update]
  );

  const setQuoteIndex = useCallback(
    (index: number) => {
      update((current) => ({
        ...current,
        quoteIndex: index,
      }));
    },
    [update]
  );

  const dismissReminder = useCallback(() => {
    setActiveReminder(null);
  }, []);

  const setActiveFocusSession = useCallback(
    (startedAt: string | null) => {
      update((current) => ({
        ...current,
        focusTimer: {
          ...current.focusTimer,
          activeSessionStartedAt: startedAt,
        },
      }));
    },
    [update]
  );

  const setPreferredFocusSound = useCallback(
    (sound: FocusSoundId | null) => {
      update((current) => ({
        ...current,
        focusMusic: {
          ...current.focusMusic,
          preferredSound: sound,
        },
      }));
    },
    [update]
  );

  const setUserPlaylistUrl = useCallback(
    (url: string | null) => {
      update((current) => ({
        ...current,
        focusMusic: {
          ...current.focusMusic,
          userPlaylistUrl: url,
        },
      }));
    },
    [update]
  );

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    (Object.keys(data.reminders) as ReminderType[]).forEach((type) => {
      const pref = data.reminders[type];
      if (!pref.enabled) return;

      const intervalMs = pref.intervalMinutes * 60 * 1000;
      const timer = setInterval(() => {
        setActiveReminder({
          type,
          message: REMINDER_LABELS[type].description,
        });
      }, intervalMs);

      intervals.push(timer);
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [data.reminders]);

  const value = useMemo<WellnessContextValue>(
    () => ({
      data,
      isLoaded: storageReady,
      summary: generateWellnessSummary(data),
      activeReminder,
      setMood,
      setFocusPreset,
      recordFocusSession,
      updateReminder,
      setHydrationCount,
      adjustHydration,
      setQuoteIndex,
      dismissReminder,
      setActiveFocusSession,
      setPreferredFocusSound,
      setUserPlaylistUrl,
    }),
    [
      data,
      activeReminder,
      setMood,
      setFocusPreset,
      recordFocusSession,
      updateReminder,
      setHydrationCount,
      adjustHydration,
      setQuoteIndex,
      dismissReminder,
      setActiveFocusSession,
      setPreferredFocusSound,
      setUserPlaylistUrl,
      storageReady,
    ]
  );

  return (
    <WellnessContext.Provider value={value}>
      {children}
      {activeReminder ? (
        <div
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-xl border border-border bg-card p-4 shadow-[var(--card-shadow)] sm:left-auto sm:right-6"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {REMINDER_LABELS[activeReminder.type].title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeReminder.message}
              </p>
            </div>
            <button
              type="button"
              onClick={dismissReminder}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
    </WellnessContext.Provider>
  );
}

export function useWellness() {
  const context = useContext(WellnessContext);
  if (!context) {
    throw new Error("useWellness must be used within a WellnessProvider");
  }
  return context;
}

export function useWellnessOptional() {
  return useContext(WellnessContext);
}
