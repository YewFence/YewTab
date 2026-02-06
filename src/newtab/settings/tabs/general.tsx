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
import FolderPickerDialog from "@/newtab/components/folder-picker-dialog";
import { useBookmarks } from "@/hooks/use-bookmarks";

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

  const [openInNewTab, setOpenInNewTab] = useState(false);
  const [openInNewTabSaving, setOpenInNewTabSaving] = useState(false);

  const [pickerOpen, setPickerOpen] = useState(false);
  const { tree } = useBookmarks();

  useEffect(() => {
    void readSearchSettings().then((settings) => setEngine(settings.defaultEngine));
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const state = await readLayoutState();
        setStartupFolderId(state.startupFolderId);
        setKeepExpansion(!!state.keepFolderExpansion);
        setOpenInNewTab(!!state.openInNewTab);

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
          // 尝试在当前加载的 tree 中查找（如果是 hooks 加载的）
          // 但这里主要依靠 snapshot 或 hooks 的 tree
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

  const toggleOpenInNewTab = async () => {
    setOpenInNewTabSaving(true);
    const next = !openInNewTab;
    setOpenInNewTab(next);
    try {
      const prev = await readLayoutState();
      await writeLayoutState({ ...prev, openInNewTab: next });
    } catch (e) {
      setOpenInNewTab(!next);
    } finally {
      setOpenInNewTabSaving(false);
    }
  };

  const handleFolderSelect = async (folderId: string, folderTitle: string) => {
    setNavSaving(true);
    setNavError(null);
    try {
      const prev = await readLayoutState();
      // 这里不设置 lastOpenFolder 为 null，允许保留？或者也重置？
      // 逻辑：如果设定了 startupFolderId，则每次打开都去那里，lastOpenFolder 可能会被覆盖
      const next: LayoutState = {
        ...prev,
        startupFolderId: folderId
      };
      await writeLayoutState(next);
      setStartupFolderId(folderId);
      // 需要重新计算完整路径 label 比较麻烦，暂时用选中的 title 或再次读取
      // 简单起见，先显示选中的文件夹名，或重新触发读取逻辑
      // 也可以再次调用 findPathInTree 更新 label
      // 为简化交互体验，这里直接更新 label
      setStartupFolderLabel(folderTitle); 
      
      // 重新读取一次以确保 label 完整（例如包含父路径），或者简化只显示当前
      // 这里选择重新触发一次读取（复用 useEffect 里的逻辑稍微麻烦，直接手动更新）
      // 实际上 useEffect 里的 path 查找比较重，可以暂时只显示 title
    } catch (e) {
      setNavError(e instanceof Error ? e.message : "设置失败");
    } finally {
      setNavSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <FolderPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onConfirm={handleFolderSelect}
        tree={tree}
        initialSelectedId={startupFolderId}
        title="选择启动文件夹"
      />

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
                onClick={() => setPickerOpen(true)}
                disabled={navSaving}
              >
                更改
              </Button>
              {startupFolderId && (
                <Button
                  variant="ghost"
                  className="text-muted-text hover:text-destructive hover:bg-destructive/10 px-2"
                  disabled={navSaving}
                  title="重置到根目录"
                  onClick={() => {
                    void (async () => {
                      setNavSaving(true);
                      setNavError(null);
                      try {
                        const prev = await readLayoutState();
                        const next: LayoutState = {
                          ...prev,
                          startupFolderId: null,
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
                  清除
                </Button>
              )}
            </div>
          }
        />
        {navError ? <div className="text-xs text-muted-text pt-1">{`操作失败：${navError}`}</div> : null}
      </SettingsSection>

      <SettingsSection title="书签" description="管理书签的行为。">
        <SettingsRow
          label="在新标签页打开"
          description="点击书签卡片时，是否总是打开新的浏览器标签页。"
          control={
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-text">{openInNewTab ? "已开启" : "已关闭"}</span>
              <Checkbox
                checked={openInNewTab}
                onChange={() => void toggleOpenInNewTab()}
                disabled={openInNewTabSaving}
              />
            </div>
          }
        />
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

