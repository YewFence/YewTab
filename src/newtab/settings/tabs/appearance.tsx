import { useMemo } from "react";
import SettingsSection from "@/newtab/settings/components/section";
import SettingsRow from "@/newtab/settings/components/row";
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
                      : "bg-white/55 border-black/5 dark:border-white/10 hover:bg-white/75 text-ink"
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

      <SettingsSection title="占位设置" description="这些先把 UI 框架搭起来，后端/存储接口写好后再接。">
        <div className="text-sm text-muted-text">
          这里会放：卡片密度、背景样式、快捷操作、书签同步策略……现在先留个坑位，UI 结构已经稳定可扩展。
        </div>
      </SettingsSection>
    </div>
  );
}
