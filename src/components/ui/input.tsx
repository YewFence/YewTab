import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-10 w-full rounded-[14px] px-3",
        "bg-glass text-ink placeholder:text-muted-text",
        "border border-border-glass",
        "shadow-[0_2px_10px_rgba(0,0,0,0.04)]",
        "transition-all duration-200",
        "focus:outline-none focus:bg-glass-strong focus:shadow-[0_10px_20px_rgba(0,0,0,0.08)]",
        "focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
