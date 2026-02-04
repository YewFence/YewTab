import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[0_10px_18px_rgba(47,128,237,0.22)] hover:shadow-[0_14px_26px_rgba(47,128,237,0.28)]",
  secondary:
    "bg-white/70 text-ink border border-black/5 dark:border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-white/85",
  ghost: "bg-transparent text-ink hover:bg-black/5",
  danger:
    "bg-destructive text-destructive-foreground shadow-[0_10px_18px_rgba(239,68,68,0.20)] hover:shadow-[0_14px_26px_rgba(239,68,68,0.26)]"
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm rounded-[12px]",
  md: "h-10 px-4 text-sm rounded-[14px]",
  lg: "h-11 px-5 text-base rounded-[16px]"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", type = "button", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold",
          "transition-all duration-200",
          "active:translate-y-px",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none disabled:transform-none",
          sizeClass[size],
          variantClass[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
