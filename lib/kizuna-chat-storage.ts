import type { KizunaChatMessage } from "@/types/kizuna-chat";
import { KIZUNA_CHAT_MAX_MESSAGES } from "@/types/kizuna-chat";

export const KIZUNA_CHAT_STORAGE_KEY = "anovia-kizuna-chat";

function normalizeMessages(value: unknown): KizunaChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is KizunaChatMessage =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as KizunaChatMessage).id === "string" &&
        ((item as KizunaChatMessage).role === "user" ||
          (item as KizunaChatMessage).role === "assistant") &&
        typeof (item as KizunaChatMessage).content === "string" &&
        typeof (item as KizunaChatMessage).createdAt === "string"
    )
    .slice(-KIZUNA_CHAT_MAX_MESSAGES);
}

export function readKizunaChatMessages(): KizunaChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(KIZUNA_CHAT_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    const messages = normalizeMessages(parsed);
    if (messages.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
      writeKizunaChatMessages(messages);
    }
    return messages;
  } catch {
    writeKizunaChatMessages([]);
    return [];
  }
}

export function writeKizunaChatMessages(messages: KizunaChatMessage[]): void {
  const trimmed = messages.slice(-KIZUNA_CHAT_MAX_MESSAGES);
  localStorage.setItem(KIZUNA_CHAT_STORAGE_KEY, JSON.stringify(trimmed));
}

export function clearKizunaChatMessages(): void {
  writeKizunaChatMessages([]);
}
