"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { APP_NAME, AI_ASSISTANT_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { GrowthGardenPreview } from "./GrowthGardenPreview";

type OnboardingFlowProps = {
  onComplete: () => void;
  onSkip: () => void;
};

const STEPS = [0, 1, 2] as const;

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");

  const goNext = () => {
    setDirection("forward");
    setStep((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setDirection("back");
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSkip = useCallback(() => {
    onSkip();
  }, [onSkip]);

  return (
    <div
      className="onboarding-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      aria-describedby="onboarding-description"
    >
      <div className="onboarding-shell">
        <button
          type="button"
          onClick={handleSkip}
          className={cn(
            "onboarding-skip rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors",
            "hover:bg-muted/60 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          Skip
        </button>

        <div className="onboarding-glass rounded-3xl p-6 sm:p-8">
          <div
            key={step}
            className={cn(
              "onboarding-step min-h-[22rem]",
              !prefersReducedMotion && direction === "back" && "onboarding-step--back"
            )}
          >
            {step === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <span className="onboarding-icon" aria-hidden>
                  🌸
                </span>
                <h1 id="onboarding-title" className="onboarding-title mt-5 font-semibold text-foreground">
                  Welcome to {APP_NAME}
                </h1>
                <p className="mt-3 text-lg font-medium text-foreground/90">
                  &ldquo;A New Way Forward&rdquo;
                </p>
                <p
                  id="onboarding-description"
                  className="onboarding-quote mt-5 max-w-md text-muted-foreground"
                >
                  Project management shouldn&apos;t just organize work.
                  <br />
                  It should help people thrive.
                </p>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="flex h-full flex-col">
                <span className="onboarding-icon" aria-hidden>
                  🤖
                </span>
                <h2 id="onboarding-title" className="onboarding-title mt-4 font-semibold text-foreground">
                  Meet {AI_ASSISTANT_NAME}
                </h2>
                <p id="onboarding-description" className="mt-2 text-sm text-muted-foreground">
                  Your AI productivity companion.
                </p>
                <p className="mt-5 text-sm font-medium text-foreground">
                  {AI_ASSISTANT_NAME} helps you:
                </p>
                <ul className="onboarding-list mt-3">
                  <li>Stay on track</li>
                  <li>Prevent burnout</li>
                  <li>Celebrate progress</li>
                  <li>Build healthy work habits</li>
                </ul>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="flex h-full flex-col">
                <span className="onboarding-icon" aria-hidden>
                  🌱
                </span>
                <h2 id="onboarding-title" className="onboarding-title mt-4 font-semibold text-foreground">
                  Grow with every achievement.
                </h2>
                <div id="onboarding-description" className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p>Complete tasks.</p>
                  <p>Build streaks.</p>
                  <p>Take healthy breaks.</p>
                  <p>Watch your workspace flourish.</p>
                </div>
                <div className="mt-5">
                  <GrowthGardenPreview />
                </div>
              </div>
            ) : null}
          </div>

          <div className="onboarding-dots mt-6" aria-hidden>
            {STEPS.map((index) => (
              <span
                key={index}
                className={cn("onboarding-dot", step === index && "is-active")}
              />
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {step > 0 ? (
              <Button variant="secondary" size="sm" onClick={goBack}>
                ← Back
              </Button>
            ) : (
              <span aria-hidden />
            )}

            {step < STEPS.length - 1 ? (
              <Button size="sm" onClick={goNext} className="ml-auto">
                Next →
              </Button>
            ) : (
              <Button size="sm" onClick={onComplete} className="ml-auto">
                ✨ Enter {APP_NAME}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
