import {
  DEFAULT_KIZUNA_REMINDERS_META,
  type KizunaRemindersMeta,
} from "@/types/kizuna-reminder";

export const KIZUNA_REMINDERS_STORAGE_KEY = "anovia-kizuna-reminders";

const MAX_STORED_IDS = 300;

function pruneIds(ids: string[]): string[] {
  if (ids.length <= MAX_STORED_IDS) return ids;
  return ids.slice(-MAX_STORED_IDS);
}

function normalizeMeta(data: Partial<KizunaRemindersMeta>): KizunaRemindersMeta {
  return {
    dismissedIds: pruneIds(
      Array.isArray(data.dismissedIds) ? data.dismissedIds : []
    ),
    toastedIds: pruneIds(Array.isArray(data.toastedIds) ? data.toastedIds : []),
    toastEnabled:
      typeof data.toastEnabled === "boolean"
        ? data.toastEnabled
        : DEFAULT_KIZUNA_REMINDERS_META.toastEnabled,
  };
}

export function readKizunaRemindersMeta(): KizunaRemindersMeta {
  if (typeof window === "undefined") {
    return DEFAULT_KIZUNA_REMINDERS_META;
  }

  try {
    const raw = localStorage.getItem(KIZUNA_REMINDERS_STORAGE_KEY);
    if (!raw) {
      writeKizunaRemindersMeta(DEFAULT_KIZUNA_REMINDERS_META);
      return DEFAULT_KIZUNA_REMINDERS_META;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      writeKizunaRemindersMeta(DEFAULT_KIZUNA_REMINDERS_META);
      return DEFAULT_KIZUNA_REMINDERS_META;
    }

    const normalized = normalizeMeta(parsed as Partial<KizunaRemindersMeta>);
    if (JSON.stringify(normalized) !== raw) {
      writeKizunaRemindersMeta(normalized);
    }
    return normalized;
  } catch {
    writeKizunaRemindersMeta(DEFAULT_KIZUNA_REMINDERS_META);
    return DEFAULT_KIZUNA_REMINDERS_META;
  }
}

export function writeKizunaRemindersMeta(data: KizunaRemindersMeta): void {
  localStorage.setItem(
    KIZUNA_REMINDERS_STORAGE_KEY,
    JSON.stringify({
      ...data,
      dismissedIds: pruneIds(data.dismissedIds),
      toastedIds: pruneIds(data.toastedIds),
    })
  );
}
