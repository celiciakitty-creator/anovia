"use client";

import { RevealOnScroll } from "@/components/motion";
import { MainLayout } from "@/components/layout";
import {
  DailyCheckIn,
  FocusMusic,
  FocusTimer,
  HydrationTracker,
  KizunaWellnessSummary,
  MotivationalQuote,
  WellnessReminders,
} from "@/components/wellness";

export function WellnessPageContent() {
  return (
    <MainLayout subtitle="Wellness">
      <div className="mx-auto max-w-7xl">
        <RevealOnScroll>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Wellness Center
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Optional tools to support focus, rest, and balance — at your own pace.
            </p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={60}>
          <KizunaWellnessSummary />
        </RevealOnScroll>

        <div className="mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
          <RevealOnScroll delay={100}>
            <DailyCheckIn />
          </RevealOnScroll>
          <RevealOnScroll delay={140}>
            <FocusTimer />
          </RevealOnScroll>
          <RevealOnScroll delay={180}>
            <WellnessReminders />
          </RevealOnScroll>
          <RevealOnScroll delay={220}>
            <HydrationTracker />
          </RevealOnScroll>
        </div>

        <RevealOnScroll className="mt-4 sm:mt-6" delay={260}>
          <MotivationalQuote />
        </RevealOnScroll>

        <RevealOnScroll className="mt-4 sm:mt-6" delay={300}>
          <FocusMusic />
        </RevealOnScroll>
      </div>
    </MainLayout>
  );
}
