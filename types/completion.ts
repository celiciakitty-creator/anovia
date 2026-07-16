export type CompletionMeta = {
  hasCelebratedFirstCompletion: boolean;
  celebratedProjectIds: string[];
  completedSectionExpanded: boolean;
};

export const DEFAULT_COMPLETION_META: CompletionMeta = {
  hasCelebratedFirstCompletion: false,
  celebratedProjectIds: [],
  completedSectionExpanded: false,
};

export type CompletionStats = {
  completedToday: number;
  completedThisWeek: number;
  streakDays: number;
};
