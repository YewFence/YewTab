import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SettingsRowProps = {
  label: string;
  description?: string;
  control: ReactNode;
  className?: string;
};

export default function SettingsRow({ label, description, control, className }: SettingsRowProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <div className="font-semibold text-ink">{label}</div>
        {description ? <div className="text-sm text-muted-text mt-1">{description}</div> : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
