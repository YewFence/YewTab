import { useMemo } from "react";
import SettingsSection from "@/newtab/settings/components/section";
import SettingsRow from "@/newtab/settings/components/row";
import BackgroundSection from "@/newtab/settings/components/background-section";
import { Radio } from "@/components/ui/radio";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

type ThemeMode = "light" | "dark" | "system";

const THEME_LABELS: Record<ThemeMode, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统"
};

export default function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const modes = useMemo(() => Object.keys(THEME_LABELS) as ThemeMode[], []);

  return (
    <div className="space-y-4">
      <SettingsSection title="主题" description="这里直接接到前端 ThemeProvider，后端接口以后再补也不影响。">
        <SettingsRow
          label="外观模式"
          description="选择浅色/深色/跟随系统"
          control={
            <div className="flex items-center gap-2">
              {modes.map((m) => (
                <label
                  key={m}
                  className={cn(
                    "inline-flex items-center gap-2",
                    "rounded-[14px] px-3 h-10 cursor-pointer",
                    "border transition-all duration-200",
                    theme === m
                      ? "bg-primary/5 border-primary/30 text-primary shadow-sm"
                      : "bg-glass-subtle border-border-glass hover:bg-glass text-ink"
                  )}
                >
                  <Radio
                    name="theme-mode"
                    checked={theme === m}
                    onChange={() => setTheme(m)}
                    aria-label={THEME_LABELS[m]}
                  />
                  <span className="text-sm font-semibold">{THEME_LABELS[m]}</span>
                </label>
              ))}
            </div>
          }
        />
      </SettingsSection>

      <BackgroundSection />
    </div>
  );
}
