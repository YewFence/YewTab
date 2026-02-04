import { useEffect, useMemo, useState } from "react";
import type { SearchEngine } from "@/shared/types";
import { readSearchSettings, writeSearchSettings } from "@/lib/storage";
import SettingsSection from "@/newtab/settings/components/section";
import { Radio } from "@/components/ui/radio";
import { cn } from "@/lib/utils";

const ENGINE_LABELS: Record<SearchEngine, string> = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo"
};

export default function GeneralTab() {
  const [engine, setEngine] = useState<SearchEngine>("google");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void readSearchSettings().then((settings) => setEngine(settings.defaultEngine));
  }, []);

  const options = useMemo(() => Object.keys(ENGINE_LABELS) as SearchEngine[], []);

  const setAndPersist = async (next: SearchEngine) => {
    setEngine(next);
    setSaving(true);
    setError(null);
    try {
      await writeSearchSettings({ defaultEngine: next });
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <SettingsSection title="搜索" description="决定地址栏输入框默认用哪个引擎搜索。">
        <div className="space-y-2">
          {options.map((key) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between gap-4",
                "rounded-[14px] px-3 py-2",
                "border transition-all duration-200",
                key === engine
                  ? "bg-primary/5 border-primary/30 shadow-[0_4px_12px_rgba(47,128,237,0.1)]"
                  : "bg-white/40 border-black/5 dark:border-white/10 hover:bg-white/60"
              )}
            >
              <div className="min-w-0">
                <div className="font-semibold text-ink">{ENGINE_LABELS[key]}</div>
                <div className="text-xs text-muted-text mt-0.5">默认搜索引擎</div>
              </div>
              <Radio
                name="search-engine"
                checked={engine === key}
                onChange={() => void setAndPersist(key)}
                aria-label={ENGINE_LABELS[key]}
              />
            </div>
          ))}
          <div className="text-xs text-muted-text pt-1">{saving ? "正在保存…" : error ? `保存失败：${error}` : ""}</div>
        </div>
      </SettingsSection>
    </div>
  );
}
