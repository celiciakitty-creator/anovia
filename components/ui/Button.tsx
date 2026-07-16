import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

const variantStyles = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 focus-visible:ring-primary",
  secondary:
    "border border-border bg-card text-foreground hover:bg-muted active:bg-muted/80 focus-visible:ring-primary",
  ghost:
    "text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/80",
};

const sizeStyles = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}
