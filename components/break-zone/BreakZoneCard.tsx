"use client";

import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

type BreakZoneCardVariant =
  | "message"
  | "timer"
  | "trivia"
  | "reaction"
  | "fact";

type BreakZoneCardProps = {
  variant: BreakZoneCardVariant;
  children: React.ReactNode;
  className?: string;
};

export function BreakZoneCard({ variant, children, className }: BreakZoneCardProps) {
  return (
    <Card
      className={cn(
        "break-zone-card h-full !p-[1.35rem]",
        `break-zone-card--${variant}`,
        className
      )}
    >
      {children}
    </Card>
  );
}

type BreakZoneTitleProps = {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
};

export function BreakZoneTitle({
  children,
  className,
  as: Tag = "h2",
}: BreakZoneTitleProps) {
  return (
    <Tag className={cn("break-zone-display font-semibold tracking-tight", className)}>
      {children}
    </Tag>
  );
}
