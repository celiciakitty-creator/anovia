"use client";

import { UserAvatar } from "@/components/profile";
import { RevealOnScroll } from "@/components/motion";
import { MainLayout } from "@/components/layout";
import { Card, EmptyState } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import type { User } from "@/types/user";

function memberDisplayName(user: User): string {
  return user.displayName.trim() || user.name;
}

function formatGithubHandle(handle: string): string | null {
  const normalized = handle.trim().replace(/^@/, "");
  return normalized ? `@${normalized}` : null;
}

function TeamMemberCard({ user }: { user: User }) {
  const displayName = memberDisplayName(user);
  const githubHandle = formatGithubHandle(user.githubHandle);

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
        <h2 className="truncate text-sm font-semibold text-foreground">
          {displayName}
        </h2>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {githubHandle ?? "No GitHub handle"}
        </p>
      </div>
    </Card>
  );
}

export function TeamDirectory() {
  const { users, isLoaded } = useWorkspace();

  const sortedUsers = [...users].sort((a, b) =>
    memberDisplayName(a).localeCompare(memberDisplayName(b), undefined, {
      sensitivity: "base",
    })
  );

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
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Team
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Workspace members from Supabase profiles. Use Tasks to assign work
              across the team.
            </p>
          </div>
        </RevealOnScroll>

        {sortedUsers.length === 0 ? (
          <RevealOnScroll delay={80}>
            <EmptyState
              title="No team members yet"
              description="When users sign up and create profiles, they will appear here."
              emoji="👥"
            />
          </RevealOnScroll>
        ) : (
          <ul
            className="grid gap-3 sm:grid-cols-2"
            aria-label={`${sortedUsers.length} team member${sortedUsers.length === 1 ? "" : "s"}`}
          >
            {sortedUsers.map((user, index) => (
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
