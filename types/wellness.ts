export type Mood = "great" | "good" | "okay" | "stressed" | "tired";

export type FocusPresetMinutes = 25 | 45 | 60;

export type FocusSoundId =
  | "lofi_focus"
  | "classical_focus"
  | "nature_sounds"
  | "white_noise"
  | "deep_work"
  | "user_playlist";

export type ReminderType = "eyeBreak" | "stretch" | "hydration";

export type ReminderPreference = {
  enabled: boolean;
  intervalMinutes: number;
};

export type WellnessData = {
  checkIn: {
    mood: Mood | null;
    date: string | null;
  };
  focusTimer: {
    presetMinutes: FocusPresetMinutes;
    sessionsCompletedToday: number;
    lastSessionDate: string | null;
    activeSessionStartedAt: string | null;
  };
  reminders: Record<ReminderType, ReminderPreference>;
  hydration: {
    count: number;
    date: string;
  };
  quoteIndex: number;
  focusMusic: {
    preferredSound: FocusSoundId | null;
    userPlaylistUrl: string | null;
  };
};

export const MOOD_OPTIONS: {
  value: Mood;
  label: string;
  emoji: string;
  style: string;
}[] = [
  { value: "great", label: "Great", emoji: "😊", style: "border-success/40 bg-success/10 text-success" },
  { value: "good", label: "Good", emoji: "🙂", style: "border-primary/40 bg-primary/10 text-primary" },
  { value: "okay", label: "Okay", emoji: "😐", style: "border-border bg-muted/50 text-foreground" },
  { value: "stressed", label: "Stressed", emoji: "😓", style: "border-warning/40 bg-warning/10 text-warning" },
  { value: "tired", label: "Tired", emoji: "😴", style: "border-secondary/30 bg-muted text-secondary" },
];

export const FOCUS_PRESETS: FocusPresetMinutes[] = [25, 45, 60];

export const HYDRATION_GOAL = 8;

export const REMINDER_INTERVAL_OPTIONS = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 45, label: "Every 45 minutes" },
  { value: 60, label: "Every 60 minutes" },
];

export const REMINDER_LABELS: Record<ReminderType, { title: string; description: string }> = {
  eyeBreak: {
    title: "Eye break",
    description: "A gentle nudge to rest your eyes from the screen.",
  },
  stretch: {
    title: "Stretch reminder",
    description: "Take a moment to move and release tension.",
  },
  hydration: {
    title: "Hydration reminder",
    description: "A friendly reminder to sip some water.",
  },
};
