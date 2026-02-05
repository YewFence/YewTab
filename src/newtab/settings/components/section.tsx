import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export default function SettingsSection({ title, description, children, className }: SettingsSectionProps) {
  return (
    <section className={cn("rounded-[18px] bg-glass border border-border-glass", "backdrop-blur-[24px]", className)}>
      <div className="px-5 py-4 border-b border-border-glass">
        <div className="text-base font-bold tracking-tight">{title}</div>
        {description ? <div className="text-sm text-muted-text mt-1">{description}</div> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
