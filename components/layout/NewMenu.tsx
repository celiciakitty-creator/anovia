"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

export function NewMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="secondary"
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Create new item"
      >
        New
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label="Create new"
          className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-[var(--card-shadow)]"
        >
          <Link
            href="/projects?create=1"
            role="menuitem"
            onClick={close}
            className="block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
          >
            New Project
          </Link>
          <Link
            href="/tasks?create=1"
            role="menuitem"
            onClick={close}
            className={cn(
              "block rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
            )}
          >
            New Task
          </Link>
        </div>
      ) : null}
    </div>
  );
}
