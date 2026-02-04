import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, defaultChecked, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          "inline-flex items-center gap-2 select-none",
          disabled ? "opacity-50" : "cursor-pointer",
          className
        )}
      >
        <span
          className={cn(
            "relative inline-flex items-center justify-center",
            "h-5 w-5 rounded-[6px]",
            "border border-black/20 dark:border-white/30",
            "bg-black/5 dark:bg-white/10",
            "shadow-inner",
            "transition-all duration-150",
            !disabled && "group-hover:bg-black/10 dark:group-hover:bg-white/20",
            checked && "bg-primary border-primary text-primary-foreground shadow-none"
          )}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "transition-all duration-200 ease-out",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <input
            ref={ref}
            type="checkbox"
            className="absolute inset-0 opacity-0"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            {...props}
          />
        </span>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
