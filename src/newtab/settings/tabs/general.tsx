import { Checkbox } from "@/components/ui/checkbox";
import { useEffect, useMemo, useState } from "react";

import type { SearchEngine } from "@/shared/types";
import type { BookmarkNode, LayoutState } from "@/shared/types";
import { readBookmarkSnapshot, readLayoutState, readSearchSettings, writeLayoutState, writeSearchSettings } from "@/lib/storage";
import SettingsSection from "@/newtab/settings/components/section";
import SettingsRow from "@/newtab/settings/components/row";
import { Radio } from "@/components/ui/radio";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ENGINE_LABELS: Record<SearchEngine, string> = {
  google: "Google",
  bing: "Bing",
  duckduckgo: "DuckDuckGo"
};

const getNodeTitle = (node: BookmarkNode): string => node.title || (node.url ?? "未命名");

const findPathInTree = (node: BookmarkNode, targetId: string): BookmarkNode[] | null => {
  if (node.id === targetId) {
    return [node];
  }
  const children = node.children ?? [];
  for (const child of children) {
    const sub = findPathInTree(child, targetId);
    if (sub) {
      return [node, ...sub];
    }
  }
  return null;
};

export default function GeneralTab() {
  const [engine, setEngine] = useState<SearchEngine>("google");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startupFolderLabel, setStartupFolderLabel] = useState<string>("根目录");
  const [startupFolderId, setStartupFolderId] = useState<string | null>(null);
  const [navSaving, setNavSaving] = useState(false);
  const [navError, setNavError] = useState<string | null>(null);

  const [keepExpansion, setKeepExpansion] = useState(false);
  const [expansionSaving, setExpansionSaving] = useState(false);

  useEffect(() => {
    void readSearchSettings().then((settings) => setEngine(settings.defaultEngine));
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const state = await readLayoutState();
        setStartupFolderId(state.startupFolderId);
        setKeepExpansion(!!state.keepFolderExpansion);

        if (!state.startupFolderId) {

          setStartupFolderLabel("根目录");
          return;
        }

        const snapshot = await readBookmarkSnapshot();
        const root = snapshot?.tree?.[0];
        if (!root) {
          setStartupFolderLabel("未知（尚无快照）");
          return;
        }

        const path = findPathInTree(root, state.startupFolderId);
        if (!path) {
          setStartupFolderLabel("未知（可能已删除）");
          return;
        }

        // path[0] 通常是虚拟 root 节点，不展示。
        const visible = path.length >= 2 ? path.slice(1) : path;
        setStartupFolderLabel(visible.map(getNodeTitle).join(" / "));
      } catch (e) {
        setStartupFolderLabel("读取失败");
      }
    })();
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

  const toggleExpansion = async () => {
    setExpansionSaving(true);
    const next = !keepExpansion;
    setKeepExpansion(next);
    try {
      const prev = await readLayoutState();
      await writeLayoutState({ ...prev, keepFolderExpansion: next });
    } catch (e) {
      setKeepExpansion(!next);
    } finally {
      setExpansionSaving(false);
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
                  : "bg-glass-subtle border-border-glass hover:bg-glass"
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

      <SettingsSection title="启动文件夹" description="打开新标签页时会自动进入该文件夹。">
        <SettingsRow
          label="当前启动文件夹"
          description="在书签文件夹上右键可设置；这里仅提供重置。"
          control={
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "max-w-[420px] truncate",
                  "text-sm font-semibold",
                  "px-3 py-2 rounded-[14px]",
                  "bg-glass-subtle border border-border-glass",
                  startupFolderId ? "text-ink" : "text-muted-text"
                )}
                title={startupFolderLabel}
              >
                {startupFolderLabel}
              </div>
              <Button
                variant="secondary"
                disabled={navSaving || !startupFolderId}
                onClick={() => {
                  void (async () => {
                    setNavSaving(true);
                    setNavError(null);
                    try {
                      const prev = await readLayoutState();
                      const next: LayoutState = {
                        ...prev,
                        startupFolderId: null,
                        // 重置到根目录：同时清掉 lastOpenFolder，避免仍然打开到上次位置。
                        lastOpenFolder: null
                      };
                      await writeLayoutState(next);
                      setStartupFolderId(null);
                      setStartupFolderLabel("根目录");
                    } catch (e) {
                      setNavError(e instanceof Error ? e.message : "重置失败");
                    } finally {
                      setNavSaving(false);
                    }
                  })();
                }}
              >
                {navSaving ? "重置中…" : "重置到根目录"}
              </Button>
            </div>
          }
        />
        {navError ? <div className="text-xs text-muted-text pt-1">{`操作失败：${navError}`}</div> : null}
      </SettingsSection>

      <SettingsSection title="文件夹" description="管理文件夹的行为。">
        <SettingsRow
          label="保持展开状态"
          description="下次进入该文件夹时，保持子文件夹的展开/折叠状态。"
          control={
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-text">{keepExpansion ? "已开启" : "已关闭"}</span>
              <Checkbox
                checked={keepExpansion}
                onChange={() => void toggleExpansion()}
                disabled={expansionSaving}
              />
            </div>
          }
        />
      </SettingsSection>
    </div>
  );
}

