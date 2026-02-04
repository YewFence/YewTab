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
    <section className={cn("rounded-[18px] bg-white/80 dark:bg-black/40 border border-black/5 dark:border-white/10", "backdrop-blur-[24px]", className)}>
      <div className="px-5 py-4 border-b border-black/5 dark:border-white/10">
        <div className="text-base font-bold tracking-tight">{title}</div>
        {description ? <div className="text-sm text-muted-text mt-1">{description}</div> : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
