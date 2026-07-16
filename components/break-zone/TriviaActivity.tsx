"use client";

import { Button } from "@/components/ui";
import { getTriviaQuestionAt } from "@/lib/break-zone-trivia-utils";
import { cn } from "@/lib/utils";
import { BreakZoneCard } from "./BreakZoneCard";
import { useBreakZone } from "./BreakZoneProvider";

function CardHeaderContent({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="break-zone-card-header mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs break-zone-subtle">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function TriviaActivity() {
  const { data, answerTrivia, nextTriviaQuestion, resetTriviaSession } = useBreakZone();
  const trivia = data.trivia;
  const currentQuestion = getTriviaQuestionAt(trivia, trivia.questionIndex);
  const isCorrect = trivia.selectedIndex === currentQuestion.correctIndex;

  return (
    <BreakZoneCard variant="trivia">
      <CardHeaderContent
        title="General Knowledge Trivia 🧠"
        description="One question at a time — no pressure."
        action={
          <span className="break-zone-chip break-zone-chip--trivia px-2.5 py-1 text-xs font-medium">
            Score {trivia.score} · {trivia.questionsAnswered} answered
          </span>
        }
      />

      <p className="text-sm font-medium">{currentQuestion.question}</p>

      <fieldset className="mt-4 space-y-2" disabled={trivia.answered}>
        <legend className="sr-only">Answer options</legend>
        {currentQuestion.options.map((option, index) => {
          const isSelected = trivia.selectedIndex === index;
          const isAnswer = index === currentQuestion.correctIndex;

          return (
            <button
              key={option}
              type="button"
              onClick={() => answerTrivia(index)}
              aria-pressed={isSelected}
              className={cn(
                "flex w-full items-center rounded-2xl border px-3 py-2.5 text-left text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !trivia.answered &&
                  "border-[var(--bz-border)] bg-[var(--bz-surface)] hover:border-[color-mix(in_srgb,var(--bz-lavender)_40%,var(--bz-border))] hover:bg-[color-mix(in_srgb,var(--bz-lavender)_6%,var(--bz-surface))]",
                trivia.answered &&
                  isAnswer &&
                  "border-[color-mix(in_srgb,var(--bz-mint)_45%,var(--bz-border))] bg-[color-mix(in_srgb,var(--bz-mint)_12%,var(--bz-surface))] text-[color-mix(in_srgb,var(--bz-mint)_75%,var(--bz-ink))]",
                trivia.answered &&
                  isSelected &&
                  !isAnswer &&
                  "border-danger/40 bg-danger/10 text-danger",
                trivia.answered &&
                  !isSelected &&
                  !isAnswer &&
                  "border-[var(--bz-border)] opacity-70"
              )}
            >
              <span className="mr-2 font-medium break-zone-subtle">
                {String.fromCharCode(65 + index)}.
              </span>
              {option}
            </button>
          );
        })}
      </fieldset>

      {trivia.answered ? (
        <div className="mt-4 space-y-3">
          <p
            className={cn(
              "text-sm font-medium",
              isCorrect
                ? "text-[color-mix(in_srgb,var(--bz-mint)_80%,var(--bz-ink))]"
                : undefined
            )}
            role="status"
          >
            {isCorrect ? "Correct — nicely done." : "Not quite — here's the answer."}
          </p>
          <p className="text-sm break-zone-subtle">{currentQuestion.explanation}</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={nextTriviaQuestion}>
              Next question
            </Button>
            <Button variant="ghost" size="sm" onClick={resetTriviaSession}>
              Reset trivia session
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Button variant="ghost" size="sm" onClick={resetTriviaSession}>
            Reset trivia session
          </Button>
        </div>
      )}
    </BreakZoneCard>
  );
}
