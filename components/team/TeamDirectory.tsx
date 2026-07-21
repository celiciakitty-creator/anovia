"use client";

import { useMemo, useState } from "react";
import { UserAvatar } from "@/components/profile";
import { RevealOnScroll } from "@/components/motion";
import { MainLayout } from "@/components/layout";
import { Badge, Card, EmptyState, Input } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import type { User } from "@/types/user";

function memberDisplayName(user: User): string {
  return user.displayName.trim() || user.name;
}

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

function TeamMemberCard({ user }: { user: User }) {
  const displayName = memberDisplayName(user);
  const githubLabel = formatGithubHandle(user.githubHandle);
  const githubUrl = githubProfileUrl(user.githubHandle);

  return (
    <Card className="flex items-center gap-4">
      <UserAvatar
        profile={{
          displayName: user.displayName || user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
        }}
        size="md"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {displayName}
          </h2>
          <Badge className="border border-border bg-muted/40 text-muted-foreground">
            Cohort member
          </Badge>
        </div>
        {githubUrl && githubLabel ? (
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block truncate text-sm text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
          >
            {githubLabel}
            <span className="sr-only"> (opens GitHub profile in a new tab)</span>
          </a>
        ) : (
          <p className="mt-1 truncate text-sm text-muted-foreground">
            No GitHub handle
          </p>
        )}
      </div>
    </Card>
  );
}

export function TeamDirectory() {
  const { users, isLoaded } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) =>
        memberDisplayName(a).localeCompare(memberDisplayName(b), undefined, {
          sensitivity: "base",
        })
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return sortedUsers;

    return sortedUsers.filter((user) => {
      const name = memberDisplayName(user).toLowerCase();
      const handle = normalizeGithubHandle(user.githubHandle).toLowerCase();
      return name.includes(query) || handle.includes(query);
    });
  }, [searchQuery, sortedUsers]);

  const memberCount = users.length;
  const hasSearchQuery = searchQuery.trim().length > 0;

  if (!isLoaded) {
    return (
      <MainLayout subtitle="Team">
        <p className="text-sm text-muted-foreground">Loading team members…</p>
      </MainLayout>
    );
  }

  return (
    <MainLayout subtitle="Team">
      <div className="mx-auto max-w-3xl">
        <RevealOnScroll>
          <div className="mb-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Team
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Workspace members from Supabase profiles. Assign tasks from the
                  Tasks page.
                </p>
              </div>
              <p
                className="text-sm font-medium text-foreground"
                aria-live="polite"
              >
                {memberCount} member{memberCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </RevealOnScroll>

        {memberCount > 0 ? (
          <RevealOnScroll delay={40}>
            <div className="mb-6">
              <Input
                label="Search members"
                name="teamSearch"
                type="search"
                placeholder="Search by name or GitHub handle"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoComplete="off"
              />
            </div>
          </RevealOnScroll>
        ) : null}

        {memberCount === 0 ? (
          <RevealOnScroll delay={80}>
            <EmptyState
              title="No team members yet"
              description="When users sign up and create profiles, they will appear here."
              emoji="👥"
            />
          </RevealOnScroll>
        ) : filteredUsers.length === 0 ? (
          <RevealOnScroll delay={80}>
            <EmptyState
              compact
              title="No matching members"
              description={
                hasSearchQuery
                  ? `No profiles match “${searchQuery.trim()}”. Try another name or GitHub handle.`
                  : "Try adjusting your search."
              }
              emoji="🔍"
            />
          </RevealOnScroll>
        ) : (
          <ul
            className="grid gap-3 sm:grid-cols-2"
            aria-label={`${filteredUsers.length} team member${filteredUsers.length === 1 ? "" : "s"}`}
          >
            {filteredUsers.map((user, index) => (
              <li key={user.id}>
                <RevealOnScroll delay={Math.min(index * 40, 200)}>
                  <TeamMemberCard user={user} />
                </RevealOnScroll>
              </li>
            ))}
          </ul>
        )}
      </div>
    </MainLayout>
  );
}
