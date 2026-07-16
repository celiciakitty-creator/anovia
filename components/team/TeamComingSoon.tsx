"use client";

import Link from "next/link";
import { useState } from "react";
import { RevealOnScroll } from "@/components/motion";
import { MainLayout } from "@/components/layout";
import { Button, Card, Modal } from "@/components/ui";
import { CommentThread } from "@/components/comments";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { TEAM_GENERAL_THREAD_ID } from "@/types/comment";
import { cn } from "@/lib/utils";
import { TeamIllustration } from "./TeamIllustration";

const COMING_SOON_FEATURES = [
  {
    title: "Team members",
    description: "Invite collaborators and manage roles in one place.",
    icon: "👥",
  },
  {
    title: "Discussions",
    description: "Keep project conversations tied to the work.",
    icon: "💬",
  },
  {
    title: "Workload balancing",
    description: "See capacity at a glance before deadlines slip.",
    icon: "⚖️",
  },
  {
    title: "Smart assignments",
    description: "Let Kizuna suggest the right owner for each task.",
    icon: "✨",
  },
  {
    title: "Team Garden",
    description: "Celebrate wins and grow team momentum together.",
    icon: "🌿",
  },
] as const;

export function TeamComingSoon() {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <MainLayout subtitle="Team">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-1">
        <RevealOnScroll className="w-full">
          <TeamIllustration />
        </RevealOnScroll>

        <RevealOnScroll className="mt-8 w-full" delay={80}>
          <Card className="w-full text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Team workspace
            </p>
            <h1 className="mt-4 text-balance text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-3xl">
              404 teammates found...
              <br />
              <span className="mt-2 block text-xl font-medium text-muted-foreground sm:text-2xl">
                Just kidding.
                <br />
                Invite your team soon. 😄
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
              {AI_ASSISTANT_NAME} is preparing your collaboration workspace.
            </p>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll className="mt-6 w-full" delay={120}>
          <Card className="w-full">
            <div className="mb-4 text-center">
              <span className="inline-flex items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                Coming soon
              </span>
              <h2 className="mt-3 text-sm font-semibold text-foreground">
                What&apos;s on the way
              </h2>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {COMING_SOON_FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className={cn(
                    "rounded-lg border border-border bg-muted/20 p-4 text-left transition-colors",
                    feature.title === "Team Garden" && "sm:col-span-2 sm:max-w-sm sm:justify-self-center sm:w-full"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-base shadow-[var(--card-shadow)]"
                      aria-hidden
                    >
                      {feature.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {feature.title}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </RevealOnScroll>

        <RevealOnScroll className="mt-6 w-full" delay={140}>
          <CommentThread
            parentType="team"
            parentId={TEAM_GENERAL_THREAD_ID}
            title="Team discussion"
            description="Announcements, ideas, and questions for your team. Saved locally in your browser — not real-time collaboration."
          />
        </RevealOnScroll>

        <RevealOnScroll className="mt-6 w-full" delay={160}>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setInviteOpen(true)}
            >
              Invite teammate
            </Button>
            <Link
              href="/"
              className={cn(
                "inline-flex h-9 w-full items-center justify-center rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors duration-200",
                "hover:bg-muted active:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto"
              )}
            >
              Return to dashboard
            </Link>
          </div>
        </RevealOnScroll>
      </div>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite teammate"
        description="Team invitations are coming soon."
      >
        <p className="text-sm text-muted-foreground">
          We&apos;re building a thoughtful way to invite collaborators, assign
          roles, and keep everyone in sync. Check back soon — {AI_ASSISTANT_NAME}{" "}
          will let you know when it&apos;s ready.
        </p>
        <div className="mt-5 flex justify-end">
          <Button size="sm" onClick={() => setInviteOpen(false)}>
            Got it
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
}
