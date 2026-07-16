"use client";

import { Button } from "@/components/ui";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { useKizunaChat } from "./KizunaChatProvider";

type AskKizunaButtonProps = {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  className?: string;
  showLabel?: boolean;
};

export function AskKizunaButton({
  variant = "secondary",
  size = "sm",
  className,
  showLabel = true,
}: AskKizunaButtonProps) {
  const { openChat } = useKizunaChat();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={openChat}
      aria-haspopup="dialog"
      aria-label={showLabel ? undefined : `Ask ${AI_ASSISTANT_NAME}`}
    >
      {showLabel ? `Ask ${AI_ASSISTANT_NAME}` : "✦"}
    </Button>
  );
}
