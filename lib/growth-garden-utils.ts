import type { Task } from "@/types/task";
import { getTaskCompletionTimestamp } from "@/lib/completion-utils";

export type GardenStage = {
  name: string;
  minProgress: number;
};

export const GARDEN_STAGES: GardenStage[] = [
  { name: "Seed", minProgress: 0 },
  { name: "Sprout", minProgress: 20 },
  { name: "Sapling", minProgress: 40 },
  { name: "Bloom", minProgress: 60 },
  { name: "Wildflowers", minProgress: 80 },
];

export const GARDEN_FALLBACK = {
  stage: "Sprout",
  progress: 62,
  streakDays: 5,
  todayLeaves: 2,
  nextUnlock: "Wildflowers",
} as const;

export type GrowthGardenStats = {
  stage: string;
  progress: number;
  streakDays: number;
  todayLeaves: number;
  nextUnlock: string;
  usingFallback: boolean;
};

function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getCompletedTasks(tasks: Task[]): Task[] {
  return tasks.filter((task) => task.status === "completed");
}

function getCompletionDateKeys(tasks: Task[]): Set<string> {
  const keys = new Set<string>();
  for (const task of getCompletedTasks(tasks)) {
    const timestamp = getTaskCompletionTimestamp(task);
    if (timestamp) {
      keys.add(toDateString(new Date(timestamp)));
    }
  }
  return keys;
}

export function getStageFromProgress(progress: number): {
  stage: string;
  nextUnlock: string;
} {
  let stageIndex = 0;
  for (let i = GARDEN_STAGES.length - 1; i >= 0; i--) {
    if (progress >= GARDEN_STAGES[i].minProgress) {
      stageIndex = i;
      break;
    }
  }

  const stage = GARDEN_STAGES[stageIndex].name;
  const nextUnlock =
    GARDEN_STAGES[stageIndex + 1]?.name ?? GARDEN_STAGES[GARDEN_STAGES.length - 1].name;

  return { stage, nextUnlock };
}

export function calculateCompletionStreak(
  tasks: Task[],
  reference = new Date()
): number {
  const completionDates = getCompletionDateKeys(tasks);
  if (completionDates.size === 0) return 0;

  let cursor = startOfDay(reference);
  const todayKey = toDateString(cursor);

  if (!completionDates.has(todayKey)) {
    cursor = addDays(cursor, -1);
  }

  let streak = 0;
  while (completionDates.has(toDateString(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

export function countTodayCompletions(
  tasks: Task[],
  reference = new Date()
): number {
  const todayKey = toDateString(startOfDay(reference));
  return getCompletedTasks(tasks).filter((task) => {
    const timestamp = getTaskCompletionTimestamp(task);
    return timestamp ? toDateString(new Date(timestamp)) === todayKey : false;
  }).length;
}

/** Derive garden stats from workspace tasks, with safe fallbacks when no task data exists. */
export function getGrowthGardenStats(
  tasks: Task[] | null | undefined,
  reference = new Date()
): GrowthGardenStats {
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  if (safeTasks.length === 0) {
    return {
      stage: GARDEN_FALLBACK.stage,
      progress: GARDEN_FALLBACK.progress,
      streakDays: GARDEN_FALLBACK.streakDays,
      todayLeaves: GARDEN_FALLBACK.todayLeaves,
      nextUnlock: GARDEN_FALLBACK.nextUnlock,
      usingFallback: true,
    };
  }

  const completedCount = getCompletedTasks(safeTasks).length;
  const progress = Math.round((completedCount / safeTasks.length) * 100);
  const { stage, nextUnlock } = getStageFromProgress(progress);

  return {
    stage,
    progress,
    streakDays: calculateCompletionStreak(safeTasks, reference),
    todayLeaves: countTodayCompletions(safeTasks, reference),
    nextUnlock,
    usingFallback: false,
  };
}
