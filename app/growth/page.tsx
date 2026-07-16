import { GrowthGardenCard } from "@/components/dashboard";
import { MainLayout } from "@/components/layout";
import { RevealOnScroll } from "@/components/motion";

export default function GrowthPage() {
  return (
    <MainLayout subtitle="Growth">
      <div className="mx-auto max-w-2xl">
        <RevealOnScroll>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Growth Garden
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Celebrate steady progress as you complete tasks and build healthy habits.
            </p>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <GrowthGardenCard />
        </RevealOnScroll>
      </div>
    </MainLayout>
  );
}
