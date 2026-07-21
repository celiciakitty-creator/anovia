import { getCompletionStats } from "@/lib/completion-utils";
import { getGrowthGardenStats } from "@/lib/growth-garden-utils";
import type { Task } from "@/types/task";
import type { User } from "@/types/user";

export type LeaderboardBadgeId =
  | "top_contributor"
  | "rising_star"
  | "longest_streak";

export type LeaderboardBadge = {
  id: LeaderboardBadgeId;
  label: string;
  emoji: string;
};

export const LEADERBOARD_BADGES: Record<LeaderboardBadgeId, LeaderboardBadge> =
  {
    top_contributor: {
      id: "top_contributor",
      label: "Top Contributor",
      emoji: "🥇",
    },
    rising_star: {
      id: "rising_star",
      label: "Rising Star",
      emoji: "🌱",
    },
    longest_streak: {
      id: "longest_streak",
      label: "Longest Streak",
      emoji: "🔥",
    },
  };

export type LeaderboardEntry = {
  userId: string;
  displayName: string;
  githubHandle: string;
  avatarUrl: string;
  gardenStage: string;
  streakDays: number;
  completedThisWeek: number;
  totalCompleted: number;
  rank: number;
  badges: LeaderboardBadge[];
};

function memberDisplayName(user: User): string {
  return user.displayName.trim() || user.name;
}

/** Tasks attributed to a workspace member for leaderboard stats. */
export function getTasksForLeaderboardUser(
  tasks: Task[],
  userId: string
): Task[] {
  return tasks.filter(
    (task) =>
      task.assigneeId === userId ||
      (task.assigneeId === null && task.createdBy === userId)
  );
}

function compareEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (b.completedThisWeek !== a.completedThisWeek) {
    return b.completedThisWeek - a.completedThisWeek;
  }
  if (b.streakDays !== a.streakDays) {
    return b.streakDays - a.streakDays;
  }
  return b.totalCompleted - a.totalCompleted;
}

export function buildLeaderboardEntries(
  users: User[],
  tasks: Task[],
  reference = new Date()
): LeaderboardEntry[] {
  const optedInUsers = users.filter((user) => user.leaderboardOptIn);

  const entries: LeaderboardEntry[] = optedInUsers.map((user) => {
    const memberTasks = getTasksForLeaderboardUser(tasks, user.id);
    const completion = getCompletionStats(memberTasks, reference);
    const garden = getGrowthGardenStats(memberTasks, reference);
    const totalCompleted = memberTasks.filter(
      (task) => task.status === "completed"
    ).length;

    return {
      userId: user.id,
      displayName: memberDisplayName(user),
      githubHandle: user.githubHandle,
      avatarUrl: user.avatarUrl,
      gardenStage: garden.stage,
      streakDays: completion.streakDays,
      completedThisWeek: completion.completedThisWeek,
      totalCompleted,
      rank: 0,
      badges: [],
    };
  });

  entries.sort(compareEntries);

  const maxStreak = entries.reduce(
    (max, entry) => Math.max(max, entry.streakDays),
    0
  );

  return entries.map((entry, index) => {
    const badges: LeaderboardBadge[] = [];
    const rank = index + 1;

    if (rank === 1 && entry.completedThisWeek > 0) {
      badges.push(LEADERBOARD_BADGES.top_contributor);
    } else if (rank === 2 && entries.length > 1) {
      badges.push(LEADERBOARD_BADGES.rising_star);
    }

    if (entry.streakDays > 0 && entry.streakDays === maxStreak) {
      badges.push(LEADERBOARD_BADGES.longest_streak);
    }

    return {
      ...entry,
      rank,
      badges,
    };
  });
}
