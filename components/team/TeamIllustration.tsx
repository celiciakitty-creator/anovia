import { cn } from "@/lib/utils";

type OrbitNodeProps = {
  className?: string;
  initials: string;
  size?: "sm" | "md";
};

function OrbitNode({ className, initials, size = "sm" }: OrbitNodeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border-2 border-card font-semibold shadow-[var(--card-shadow)]",
        size === "md" ? "h-14 w-14 text-sm" : "h-10 w-10 text-xs",
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function TeamIllustration() {
  return (
    <div
      className="relative mx-auto flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full border border-dashed border-border/80" />
      <div className="absolute inset-4 rounded-full border border-border/50 bg-muted/30" />
      <div className="absolute inset-10 rounded-full bg-primary/5" />

      <OrbitNode
        size="md"
        initials="K"
        className="relative z-10 bg-primary text-primary-foreground"
      />

      <OrbitNode
        initials="SC"
        className="absolute -top-1 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground"
      />
      <OrbitNode
        initials="ML"
        className="absolute top-1/2 -right-1 -translate-y-1/2 bg-success/90 text-primary-foreground"
      />
      <OrbitNode
        initials="AP"
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-secondary/20 text-foreground"
      />
      <OrbitNode
        initials="?"
        className="absolute top-1/2 -left-1 -translate-y-1/2 border-dashed border-border bg-muted text-muted-foreground"
      />

      <span
        className="absolute -bottom-5 text-lg opacity-80"
        role="img"
        aria-label="Team garden"
      >
        🌱
      </span>
    </div>
  );
}
