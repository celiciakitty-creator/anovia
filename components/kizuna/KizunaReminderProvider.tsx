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
import { useWellness } from "@/components/wellness";
import { useWorkspace } from "@/components/workspace";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import {
  filterDismissedReminders,
  generateKizunaReminders,
} from "@/lib/kizuna-reminders";
import {
  readKizunaRemindersMeta,
  writeKizunaRemindersMeta,
} from "@/lib/kizuna-reminders-storage";
import {
  DEFAULT_KIZUNA_REMINDERS_META,
  type KizunaReminder,
  type KizunaRemindersMeta,
} from "@/types/kizuna-reminder";
import { KizunaReminderToastStack } from "./KizunaReminderToastStack";

type KizunaReminderContextValue = {
  reminders: KizunaReminder[];
  reminderCount: number;
  /** True once client storage is loaded and reminders are safe to display. */
  isHydrated: boolean;
  toastEnabled: boolean;
  dismissReminder: (id: string) => void;
  setToastEnabled: (enabled: boolean) => void;
};

const KizunaReminderContext = createContext<KizunaReminderContextValue | null>(
  null
);

const TOAST_DURATION_MS = 5000;
const MAX_VISIBLE_TOASTS = 2;

export function KizunaReminderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { raw } = useWorkspace();
  const { data: wellnessData } = useWellness();
  const storageReady = useStorageHydration();
  const [meta, setMeta] = useState<KizunaRemindersMeta>(
    DEFAULT_KIZUNA_REMINDERS_META
  );
  const [now, setNow] = useState<Date | null>(null);
  const [activeToasts, setActiveToasts] = useState<KizunaReminder[]>([]);
  const pendingToastRef = useRef<string[]>([]);
  const storageLoadedRef = useRef(false);

  useEffect(() => {
    if (!storageReady || storageLoadedRef.current) return;
    storageLoadedRef.current = true;
    setMeta(readKizunaRemindersMeta());
    setNow(new Date());
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || now === null) return;

    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, [storageReady, now]);

  const isReady = storageReady && now !== null;

  const allReminders = useMemo(() => {
    if (!isReady || !now) return [];
    return generateKizunaReminders(raw, wellnessData, now);
  }, [isReady, raw, wellnessData, now]);

  const reminders = useMemo(() => {
    if (!isReady) return [];
    return filterDismissedReminders(allReminders, meta.dismissedIds);
  }, [allReminders, meta.dismissedIds, isReady]);

  const persistMeta = useCallback((next: KizunaRemindersMeta) => {
    writeKizunaRemindersMeta(next);
    setMeta(next);
  }, []);

  const dismissReminder = useCallback((id: string) => {
    setActiveToasts((current) => current.filter((toast) => toast.id !== id));
    setMeta((current) => {
      if (current.dismissedIds.includes(id)) return current;
      const next = {
        ...current,
        dismissedIds: [...current.dismissedIds, id],
      };
      writeKizunaRemindersMeta(next);
      return next;
    });
  }, []);

  const setToastEnabled = useCallback(
    (enabled: boolean) => {
      persistMeta({
        ...meta,
        toastEnabled: enabled,
      });
    },
    [meta, persistMeta]
  );

  useEffect(() => {
    if (!isReady || !meta.toastEnabled) return;

    const eligible = reminders.filter(
      (reminder) =>
        reminder.toastEligible &&
        !meta.toastedIds.includes(reminder.id) &&
        !pendingToastRef.current.includes(reminder.id)
    );

    if (eligible.length === 0) return;

    const toShow = eligible.slice(0, MAX_VISIBLE_TOASTS);
    pendingToastRef.current.push(...toShow.map((reminder) => reminder.id));

    const showTimeout = window.setTimeout(() => {
      setActiveToasts((current) => {
        const existingIds = new Set(current.map((toast) => toast.id));
        const merged = [...current];
        for (const reminder of toShow) {
          if (!existingIds.has(reminder.id)) merged.push(reminder);
        }
        return merged.slice(-MAX_VISIBLE_TOASTS);
      });

      setMeta((current) => {
        const newIds = toShow
          .map((reminder) => reminder.id)
          .filter((id) => !current.toastedIds.includes(id));
        if (newIds.length === 0) return current;

        const next = {
          ...current,
          toastedIds: [...current.toastedIds, ...newIds],
        };
        writeKizunaRemindersMeta(next);
        return next;
      });
    }, 0);

    const hideTimeout = window.setTimeout(() => {
      setActiveToasts((current) =>
        current.filter((toast) => !toShow.some((item) => item.id === toast.id))
      );
    }, TOAST_DURATION_MS);

    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [isReady, reminders, meta.toastEnabled, meta.toastedIds]);

  const value = useMemo<KizunaReminderContextValue>(
    () => ({
      reminders,
      reminderCount: isReady ? reminders.length : 0,
      isHydrated: isReady,
      toastEnabled: meta.toastEnabled,
      dismissReminder,
      setToastEnabled,
    }),
    [reminders, isReady, meta.toastEnabled, dismissReminder, setToastEnabled]
  );

  return (
    <KizunaReminderContext.Provider value={value}>
      {children}
      {isReady && meta.toastEnabled ? (
        <KizunaReminderToastStack
          reminders={activeToasts}
          onDismiss={dismissReminder}
        />
      ) : null}
    </KizunaReminderContext.Provider>
  );
}

export function useKizunaReminders() {
  const context = useContext(KizunaReminderContext);
  if (!context) {
    throw new Error(
      "useKizunaReminders must be used within a KizunaReminderProvider"
    );
  }
  return context;
}
