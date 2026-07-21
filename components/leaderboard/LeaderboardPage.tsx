"use client";

import Link from "next/link";
import { useMemo } from "react";
import { UserAvatar } from "@/components/profile";
import { RevealOnScroll } from "@/components/motion";
import { MainLayout } from "@/components/layout";
import { Badge, Card, EmptyState } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import {
  buildLeaderboardEntries,
  type LeaderboardEntry,
} from "@/lib/leaderboard-utils";
import { cn } from "@/lib/utils";

function normalizeGithubHandle(handle: string): string {
  return handle.trim().replace(/^@/, "");
}

function formatGithubHandle(handle: string): string | null {
  const normalized = normalizeGithubHandle(handle);
  return normalized ? `@${normalized}` : null;
}

function githubProfileUrl(handle: string): string | null {
  const normalized = normalizeGithubHandle(handle);
  return normalized ? `https://github.com/${normalized}` : null;
}

function LeaderboardBadges({ badges }: { badges: LeaderboardEntry["badges"] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <Badge
          key={badge.id}
          className="border border-primary/20 bg-primary/10 text-primary"
        >
          <span aria-hidden>{badge.emoji}</span> {badge.label}
        </Badge>
      ))}
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const githubLabel = formatGithubHandle(entry.githubHandle);
  const githubUrl = githubProfileUrl(entry.githubHandle);

  return (
    <tr
      className={cn(
        "border-b border-border last:border-b-0",
        isCurrentUser && "bg-primary/5"
      )}
    >
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
        #{entry.rank}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <UserAvatar
            profile={{
              displayName: entry.displayName,
              email: "",
              avatarUrl: entry.avatarUrl,
            }}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.displayName}
              {isCurrentUser ? (
                <span className="sr-only"> (you)</span>
              ) : null}
            </p>
            {githubUrl && githubLabel ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
              >
                {githubLabel}
                <span className="sr-only">
                  {" "}
                  (opens GitHub profile in a new tab)
                </span>
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">No GitHub handle</p>
            )}
          </div>
        </div>
      </td>
      <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
        {entry.gardenStage}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
        {entry.streakDays > 0 ? (
          <>
            <span aria-hidden>🔥 </span>
            {entry.streakDays} day{entry.streakDays === 1 ? "" : "s"}
          </>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground">
        {entry.completedThisWeek}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
        {entry.totalCompleted}
      </td>
      <td className="hidden px-4 py-3 lg:table-cell">
        <LeaderboardBadges badges={entry.badges} />
      </td>
    </tr>
  );
}

function LeaderboardMobileCard({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  const githubLabel = formatGithubHandle(entry.githubHandle);
  const githubUrl = githubProfileUrl(entry.githubHandle);

  return (
    <Card
      className={cn(
        "space-y-3 p-4",
        isCurrentUser && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-sm font-semibold text-muted-foreground">
            #{entry.rank}
          </span>
          <UserAvatar
            profile={{
              displayName: entry.displayName,
              email: "",
              avatarUrl: entry.avatarUrl,
            }}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {entry.displayName}
              {isCurrentUser ? (
                <span className="sr-only"> (you)</span>
              ) : null}
            </p>
            {githubUrl && githubLabel ? (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-primary underline-offset-4 hover:underline"
              >
                {githubLabel}
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">No GitHub handle</p>
            )}
          </div>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">Garden stage</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {entry.gardenStage}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Current streak</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {entry.streakDays > 0
              ? `${entry.streakDays} day${entry.streakDays === 1 ? "" : "s"}`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">This week</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {entry.completedThisWeek}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">All time</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {entry.totalCompleted}
          </dd>
        </div>
      </dl>

      <LeaderboardBadges badges={entry.badges} />
    </Card>
  );
}

export function LeaderboardPage() {
  const { users, tasks, isLoaded, currentUserId } = useWorkspace();

  const entries = useMemo(
    () => buildLeaderboardEntries(users, tasks),
    [users, tasks]
  );

  const currentUser = users.find((user) => user.id === currentUserId);
  const currentUserOptedIn = currentUser?.leaderboardOptIn ?? false;

  if (!isLoaded) {
    return (
      <MainLayout subtitle="Team">
        <p className="text-sm text-muted-foreground">Loading leaderboard…</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout subtitle="Team">
      <div className="mx-auto max-w-5xl">
        <RevealOnScroll>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Team Leaderboard
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Celebrate progress together. Rankings highlight weekly momentum,
              streaks, and completed work — opt in from your profile when you
              are ready to share.
            </p>
          </div>
        </RevealOnScroll>

        {!currentUserOptedIn ? (
          <RevealOnScroll delay={40}>
            <Card className="mb-6 border-primary/20 bg-primary/5 p-4">
              <p className="text-sm text-foreground">
                You are not visible on the leaderboard yet.{" "}
                <Link
                  href="/profile"
                  className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
                >
                  Enable &ldquo;Appear on Team Leaderboard&rdquo; in your profile
                </Link>{" "}
                to join in when you feel like sharing.
              </p>
            </Card>
          </RevealOnScroll>
        ) : null}

        {entries.length === 0 ? (
          <RevealOnScroll delay={80}>
            <EmptyState
              title="The leaderboard is waiting for teammates"
              description="No one has opted in yet. When you and your cohort choose to appear, completed tasks and streaks will show up here as friendly motivation — never pressure."
              emoji="🌱"
              actionLabel="Update profile settings"
              actionHref="/profile"
              kizunaMessage="Opt in from your profile whenever you are ready. There is no rush — progress is personal until you choose to share it."
            />
          </RevealOnScroll>
        ) : entries.length === 1 ? (
          <RevealOnScroll delay={80}>
            <EmptyState
              title="You are building momentum"
              description="Only one teammate is sharing progress so far. Invite others to opt in from their profile when they are comfortable — the more voices, the more encouragement for everyone."
              emoji="✨"
              actionLabel="Invite via profile settings"
              actionHref="/profile"
              className="mb-6"
            />
            <LeaderboardMobileCard
              entry={entries[0]}
              isCurrentUser={entries[0].userId === currentUserId}
            />
          </RevealOnScroll>
        ) : (
          <>
            <RevealOnScroll delay={40}>
              <p
                className="mb-4 text-sm font-medium text-foreground"
                aria-live="polite"
              >
                {entries.length} teammate{entries.length === 1 ? "" : "s"}{" "}
                sharing progress
              </p>
            </RevealOnScroll>

            <RevealOnScroll delay={60} className="hidden md:block">
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left">
                    <caption className="sr-only">
                      Team leaderboard ranked by tasks completed this week
                    </caption>
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th scope="col" className="px-4 py-3">
                          Rank
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Member
                        </th>
                        <th
                          scope="col"
                          className="hidden px-4 py-3 sm:table-cell"
                        >
                          Garden stage
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Streak
                        </th>
                        <th scope="col" className="px-4 py-3">
                          This week
                        </th>
                        <th scope="col" className="px-4 py-3">
                          All time
                        </th>
                        <th
                          scope="col"
                          className="hidden px-4 py-3 lg:table-cell"
                        >
                          Highlights
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((entry) => (
                        <LeaderboardRow
                          key={entry.userId}
                          entry={entry}
                          isCurrentUser={entry.userId === currentUserId}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </RevealOnScroll>

            <ul
              className="grid gap-3 md:hidden"
              aria-label={`${entries.length} teammates on the leaderboard`}
            >
              {entries.map((entry, index) => (
                <li key={entry.userId}>
                  <RevealOnScroll delay={Math.min(index * 40, 200)}>
                    <LeaderboardMobileCard
                      entry={entry}
                      isCurrentUser={entry.userId === currentUserId}
                    />
                  </RevealOnScroll>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </MainLayout>
  );
}
