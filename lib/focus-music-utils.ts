import {
  FOCUS_MUSIC_PRESETS,
  USER_PLAYLIST_PRESET,
} from "@/data/focus-music-links";
import type { FocusSoundId } from "@/types/wellness";

export function isValidExternalUrl(url: string): boolean {
  const trimmed = url.trim();
  return /^https?:\/\/.+/i.test(trimmed);
}

export function getFocusSoundLabel(id: FocusSoundId): string {
  if (id === "user_playlist") return USER_PLAYLIST_PRESET.label;
  return FOCUS_MUSIC_PRESETS[id].label;
}

export function getFocusMusicUrl(
  id: FocusSoundId,
  userPlaylistUrl: string | null
): string | null {
  if (id === "user_playlist") {
    return userPlaylistUrl && isValidExternalUrl(userPlaylistUrl)
      ? userPlaylistUrl.trim()
      : null;
  }
  return FOCUS_MUSIC_PRESETS[id].url;
}

export function getKizunaFocusMusicMessage(
  preferredSound: FocusSoundId | null
): string | null {
  if (!preferredSound) return null;

  const label = getFocusSoundLabel(preferredSound);
  return `Your ${label} playlist is ready when you begin your next focus session.`;
}
