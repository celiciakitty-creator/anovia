"use client";

import { RevealOnScroll } from "@/components/motion";
import { ActivityCard } from "./ActivityCard";
import { CalendarCard } from "./CalendarCard";
import { KizunaAI } from "./KizunaAI";
import { ProjectsCard } from "./ProjectsCard";
import { TasksCard } from "./TasksCard";
import { GrowthGardenCard } from "./GrowthGardenCard";
import { CompletedStatsCard } from "./CompletedStatsCard";
import { WeeklyProgressCard } from "./WeeklyProgressCard";
import { WelcomeSection } from "./WelcomeSection";

export function DashboardGrid() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:gap-6">
      <RevealOnScroll>
        <WelcomeSection />
      </RevealOnScroll>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <RevealOnScroll className="lg:col-span-2" delay={80}>
          <KizunaAI />
        </RevealOnScroll>
        <RevealOnScroll delay={160}>
          <div className="flex h-full flex-col gap-4 sm:gap-6">
            <CompletedStatsCard />
            <WeeklyProgressCard />
            <GrowthGardenCard navHref="/growth" />
          </div>
        </RevealOnScroll>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RevealOnScroll delay={80}>
          <ProjectsCard />
        </RevealOnScroll>
        <RevealOnScroll delay={120}>
          <TasksCard />
        </RevealOnScroll>
        <RevealOnScroll delay={160}>
          <CalendarCard />
        </RevealOnScroll>
      </div>

      <RevealOnScroll delay={80}>
        <ActivityCard />
      </RevealOnScroll>
    </div>
  );
}
