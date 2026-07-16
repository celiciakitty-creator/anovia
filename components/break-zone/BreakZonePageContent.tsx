"use client";

import Link from "next/link";
import { RevealOnScroll } from "@/components/motion";
import { MainLayout } from "@/components/layout";
import { cn } from "@/lib/utils";
import { BreakTimer } from "./BreakTimer";
import { BreakZoneTitle } from "./BreakZoneCard";
import { DailyFunFact } from "./DailyFunFact";
import { KizunaBreakMessage } from "./KizunaBreakMessage";
import { ReactionGame } from "./ReactionGame";
import { TriviaActivity } from "./TriviaActivity";

export function BreakZonePageContent() {
  return (
    <MainLayout subtitle="Break Zone">
      <div className="break-zone-page mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <BreakZoneTitle as="h1" className="text-2xl sm:text-3xl">
                Welcome to your little reset corner ✨
              </BreakZoneTitle>
              <p className="mt-2 text-sm break-zone-subtle">
                Take a breath, play for a moment, then return when you&apos;re ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/"
                className={cn(
                  "break-zone-btn-primary inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                Return to work
              </Link>
              <Link
                href="/tasks"
                className={cn(
                  "break-zone-btn-secondary inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                )}
              >
                Go to tasks
              </Link>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={60}>
          <KizunaBreakMessage />
        </RevealOnScroll>

        <RevealOnScroll className="mt-6" delay={100}>
          <BreakTimer />
        </RevealOnScroll>

        <div className="mt-6 grid gap-5 sm:gap-6 lg:grid-cols-3">
          <RevealOnScroll delay={140}>
            <TriviaActivity />
          </RevealOnScroll>
          <RevealOnScroll delay={180}>
            <ReactionGame />
          </RevealOnScroll>
          <RevealOnScroll delay={220}>
            <DailyFunFact />
          </RevealOnScroll>
        </div>
      </div>
    </MainLayout>
  );
}
