"use client";

import { Button, Card, CardHeader } from "@/components/ui";
import { useOnboarding } from "@/components/onboarding";

export function OnboardingSettings() {
  const { replayOnboarding } = useOnboarding();

  return (
    <Card>
      <CardHeader
        title="Onboarding"
        description="Replay the welcome tour anytime"
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Walk through Anovia&apos;s introduction again — welcome, Kizuna, and the Growth
        Garden preview.
      </p>
      <Button variant="secondary" size="sm" onClick={replayOnboarding}>
        Replay onboarding
      </Button>
    </Card>
  );
}
