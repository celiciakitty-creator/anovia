"use client";

import { Button, Card, CardHeader } from "@/components/ui";
import { getNextQuoteIndex, getQuote } from "@/lib/wellness-utils";
import { useWellness } from "./WellnessProvider";

export function MotivationalQuote() {
  const { data, setQuoteIndex } = useWellness();
  const quote = getQuote(data.quoteIndex);

  const showNewQuote = () => {
    setQuoteIndex(getNextQuoteIndex(data.quoteIndex));
  };

  return (
    <Card className="h-full">
      <CardHeader
        title="Motivational Quote"
        description="A calm thought for your day"
      />

      <blockquote className="rounded-lg border border-border bg-muted/20 px-4 py-5">
        <p className="text-sm leading-relaxed text-foreground">
          &ldquo;{quote.text}&rdquo;
        </p>
        <footer className="mt-3 text-xs text-muted-foreground">— {quote.author}</footer>
      </blockquote>

      <div className="mt-4">
        <Button variant="secondary" size="sm" onClick={showNewQuote}>
          New quote
        </Button>
      </div>
    </Card>
  );
}
