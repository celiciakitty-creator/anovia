"use client";

import { Button } from "@/components/ui";
import { getFunFact, getNextFactIndex } from "@/lib/break-zone-storage";
import { BreakZoneCard } from "./BreakZoneCard";
import { useBreakZone } from "./BreakZoneProvider";

export function DailyFunFact() {
  const { data, sessionFactIndex, setSessionFactIndex } = useBreakZone();
  const fact = getFunFact(sessionFactIndex);
  const isDailyDefault = sessionFactIndex === data.dailyFact.factIndex;

  const showAnother = () => {
    setSessionFactIndex(getNextFactIndex(sessionFactIndex));
  };

  const showDaily = () => {
    setSessionFactIndex(data.dailyFact.factIndex);
  };

  return (
    <BreakZoneCard variant="fact">
      <div className="break-zone-card-header mb-4">
        <h2 className="break-zone-display text-sm font-semibold">
          Daily Fun Fact 🍑
        </h2>
        <p className="mt-0.5 text-xs break-zone-subtle">
          {isDailyDefault ? "Today's fact" : "Browsing another fact"}
        </p>
      </div>

      <blockquote className="break-zone-quote rounded-[1.15rem] px-4 py-5">
        <p className="text-sm leading-relaxed">{fact}</p>
      </blockquote>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={showAnother}>
          Show another
        </Button>
        {!isDailyDefault ? (
          <Button variant="ghost" size="sm" onClick={showDaily}>
            Back to today&apos;s fact
          </Button>
        ) : null}
      </div>
    </BreakZoneCard>
  );
}
