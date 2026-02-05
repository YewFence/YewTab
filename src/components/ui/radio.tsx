import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type RadioProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
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
            "h-5 w-5 rounded-full",
            "border border-border-inset",
            "bg-bg-inset", // 降低背景亮度，形成“凹槽”感，与纯白/玻璃背景区分
            "shadow-inner", // 增加内阴影增强深度感
            "transition-all duration-150",
            !disabled && "group-hover:bg-bg-inset-hover"
          )}
        >
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full bg-primary shadow-sm",
              "transition-all duration-200 ease-out",
              checked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          />
          <input
            ref={ref}
            type="radio"
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

Radio.displayName = "Radio";
