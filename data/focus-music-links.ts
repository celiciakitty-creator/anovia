import type { FocusSoundId } from "@/types/wellness";

/**
 * External focus-music links — update URLs here without touching UI code.
 * All preset links are placeholders pointing to general public search pages.
 */
export const FOCUS_MUSIC_PRESETS: Record<
  Exclude<FocusSoundId, "user_playlist">,
  {
    label: string;
    emoji: string;
    description: string;
    url: string;
  }
> = {
  lofi_focus: {
    label: "Lo-fi Focus",
    emoji: "🎧",
    description: "Soft beats to settle into steady, unhurried work.",
    url: "https://www.youtube.com/results?search_query=lofi+focus+study+music",
  },
  classical_focus: {
    label: "Classical Focus",
    emoji: "🎻",
    description: "Calm classical tones for deep reading and thoughtful tasks.",
    url: "https://www.youtube.com/results?search_query=classical+focus+music",
  },
  nature_sounds: {
    label: "Nature Sounds",
    emoji: "🌿",
    description: "Rain, forest, and gentle ambience to soften your workspace.",
    url: "https://www.youtube.com/results?search_query=nature+sounds+focus",
  },
  white_noise: {
    label: "White Noise",
    emoji: "🌊",
    description: "Steady background sound to mask distractions.",
    url: "https://www.youtube.com/results?search_query=white+noise+focus",
  },
  deep_work: {
    label: "Deep Work",
    emoji: "🧠",
    description: "Minimal, immersive soundscapes for long concentration blocks.",
    url: "https://www.youtube.com/results?search_query=deep+work+focus+music",
  },
};

export const FOCUS_SOUND_ORDER: FocusSoundId[] = [
  "lofi_focus",
  "classical_focus",
  "nature_sounds",
  "white_noise",
  "deep_work",
  "user_playlist",
];

export const USER_PLAYLIST_PRESET = {
  label: "User's Own Playlist",
  emoji: "✨",
  description: "Save a link to your favorite playlist or ambient mix.",
} as const;

export const FOCUS_SOUND_SELECT_OPTIONS = FOCUS_SOUND_ORDER.map((id) => ({
  value: id,
  label:
    id === "user_playlist"
      ? USER_PLAYLIST_PRESET.label
      : FOCUS_MUSIC_PRESETS[id].label,
}));
