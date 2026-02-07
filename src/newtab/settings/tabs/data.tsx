import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BookmarkNode } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Radio } from "@/components/ui/radio";
import { cn } from "@/lib/utils";
import SettingsSection from "@/newtab/settings/components/section";
import SettingsRow from "@/newtab/settings/components/row";
import { IconDownload, IconUpload } from "@/newtab/settings/icons";
import FolderPickerDialog from "@/newtab/components/folder-picker-dialog";
import { useBookmarks } from "@/hooks/use-bookmarks";
import {
  exportBookmarksToHtml,
  exportYewTabBackup,
  serializeBackup,
  downloadFile,
  importBookmarksFromHtml,
  importYewTabBackup,
  parseBackupFile
} from "@/lib/import-export";
import {
  readBookmarkSnapshot,
  readLayoutState,
  readSearchSettings,
  readBackgroundSettings
} from "@/lib/storage";

type ExportFormat = "html" | "json";

type FolderOption = {
  id: string;
  title: string;
  depth: number;
};

export default function DataTab() {
  // 书签数据
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  
  // 导出状态
  const [exportFormat, setExportFormat] = useState<ExportFormat>("html");
  const [exportRootId, setExportRootId] = useState<string>("");
  const [exportRootLabel, setExportRootLabel] = useState<string>("全部书签");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  
  // 导出 Dialog
  const [exportPickerOpen, setExportPickerOpen] = useState(false);

  // 导入状态
  const [importTargetId, setImportTargetId] = useState<string>("1"); // 默认为书签栏
  const [importTargetLabel, setImportTargetLabel] = useState<string>("书签栏");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  
  // 导入 Dialog
  const [importPickerOpen, setImportPickerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);
  
  // 使用 hooks 获取书签树
  const { tree } = useBookmarks();

  // 加载书签数据
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    void (async () => {
      const snapshot = await readBookmarkSnapshot();
      if (snapshot?.tree) {
        setBookmarks(snapshot.tree);
        // 如果需要基于 tree 计算默认值
      }
    })();
  }, []);


  // 导出处理
  const handleExport = useCallback(async () => {
    setExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const timestamp = new Date().toISOString().slice(0, 10);

      if (exportFormat === "html") {
        const html = exportBookmarksToHtml(bookmarks, {
          rootId: exportRootId || undefined
        });
        downloadFile(html, `bookmarks-${timestamp}.html`, "text/html");
        setExportSuccess("书签已导出为 HTML 文件");
      } else {
        // JSON 完整备份
        const layoutState = await readLayoutState();
        const searchSettings = await readSearchSettings();
        const backgroundSettings = await readBackgroundSettings();

        const backup = await exportYewTabBackup(
          bookmarks,
          layoutState,
          searchSettings,
          backgroundSettings
        );

        const json = serializeBackup(backup);
        downloadFile(json, `yew-tab-backup-${timestamp}.json`, "application/json");
        setExportSuccess("完整备份已导出");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "导出失败";
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  }, [exportFormat, exportRootId, bookmarks]);

  // 导入处理
  const handleImport = useCallback(async (file: File) => {
    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const content = await file.text();
      const isJson = file.name.endsWith(".json");

      if (isJson) {
        // JSON 备份导入
        const { backup, error } = parseBackupFile(content);
        if (error || !backup) {
          setImportError(error || "无法解析备份文件");
          return;
        }

        const result = await importYewTabBackup(backup, {
          targetFolderId: importTargetId
        });

        if (result.success) {
          const parts = [];
          if (result.bookmarksImported > 0 || result.foldersImported > 0) {
            parts.push(`导入了 ${result.foldersImported} 个文件夹和 ${result.bookmarksImported} 个书签`);
          }
          if (result.settingsRestored) {
            parts.push("设置已恢复");
          }
          setImportSuccess(parts.join("，") || "导入完成");
          if (result.warnings.length > 0) {
            setImportError(result.warnings.join("；"));
          }
        } else {
          setImportError(result.errors.join("；"));
        }
      } else {
        // HTML 书签导入
        const result = await importBookmarksFromHtml(content, {
          targetFolderId: importTargetId
        });

        if (result.success) {
          setImportSuccess(`导入了 ${result.folderCount} 个文件夹和 ${result.importedCount} 个书签`);
        } else {
          setImportError(result.errors.join("；"));
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "导入失败";
      setImportError(msg);
    } finally {
      setImporting(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [importTargetId]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleImport(file);
    }
  }, [handleImport]);

  const onExportFolderSelect = (id: string, title: string) => {
    setExportRootId(id);
    setExportRootLabel(title);
  };

  const onImportFolderSelect = (id: string, title: string) => {
    setImportTargetId(id);
    setImportTargetLabel(title);
  };

  return (
    <div className="space-y-4">
      {/* 导出文件夹选择器 */}
      <FolderPickerDialog
        open={exportPickerOpen}
        onClose={() => setExportPickerOpen(false)}
        onConfirm={onExportFolderSelect}
        tree={tree}
        initialSelectedId={exportRootId || "0"} // 默认为 "0" (全部书签)
        title="选择导出文件夹"
      />

      {/* 导入文件夹选择器 */}
      <FolderPickerDialog
        open={importPickerOpen}
        onClose={() => setImportPickerOpen(false)}
        onConfirm={onImportFolderSelect}
        tree={tree}
        initialSelectedId={importTargetId}
        title="选择导入文件夹"
      />

      {/* 导出区域 */}
      <SettingsSection title="导出" description="将书签导出为文件，方便备份或迁移到其他浏览器。">
        <div className="space-y-4">
          {/* 导出格式选择 */}
          <SettingsRow
            label="导出格式"
            description="选择导出的文件格式"
            control={
              <div className="flex flex-col gap-2">
                <div
                  className={cn(
                    "flex items-center justify-between gap-4",
                    "rounded-[14px] px-3 py-2",
                    "border transition-all duration-200 cursor-pointer",
                    exportFormat === "html"
                      ? "bg-primary/5 border-primary/30 shadow-[0_4px_12px_rgba(47,128,237,0.1)]"
                      : "bg-glass-subtle border-border-glass hover:bg-glass"
                  )}
                  onClick={() => setExportFormat("html")}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-sm">浏览器通用 (HTML)</div>
                    <div className="text-xs text-muted-text">所有浏览器都能导入</div>
                  </div>
                  <Radio
                    name="export-format"
                    checked={exportFormat === "html"}
                    onChange={() => setExportFormat("html")}
                  />
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between gap-4",
                    "rounded-[14px] px-3 py-2",
                    "border transition-all duration-200 cursor-pointer",
                    exportFormat === "json"
                      ? "bg-primary/5 border-primary/30 shadow-[0_4px_12px_rgba(47,128,237,0.1)]"
                      : "bg-glass-subtle border-border-glass hover:bg-glass"
                  )}
                  onClick={() => setExportFormat("json")}
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-ink text-sm">完整备份 (JSON)</div>
                    <div className="text-xs text-muted-text">包含书签、设置、背景图片</div>
                  </div>
                  <Radio
                    name="export-format"
                    checked={exportFormat === "json"}
                    onChange={() => setExportFormat("json")}
                  />
                </div>
              </div>
            }
          />

          {/* 导出范围（仅 HTML） */}
          {exportFormat === "html" && (
            <SettingsRow
              label="导出范围"
              description="选择要导出的文件夹"
              control={
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "max-w-[240px] truncate",
                      "text-sm font-semibold",
                      "px-3 py-2 rounded-[14px]",
                      "bg-glass-subtle border border-border-glass",
                      "text-ink"
                    )}
                    title={exportRootLabel}
                  >
                    {exportRootLabel}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setExportPickerOpen(true)}
                    disabled={exporting}
                  >
                    选择
                  </Button>
                </div>
              }
            />
          )}


          {/* 导出按钮 */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="primary"
              className="shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              disabled={exporting}
              onClick={() => void handleExport()}
            >
              <IconDownload className="h-4 w-4 mr-2" />
              {exporting ? "导出中…" : "导出"}
            </Button>
            {exportSuccess && (
              <span className="text-sm text-green-600 dark:text-green-400">{exportSuccess}</span>
            )}
            {exportError && (
              <span className="text-sm text-red-600 dark:text-red-400">{exportError}</span>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* 导入区域 */}
      <SettingsSection title="导入" description="从文件导入书签或恢复备份。">
        <div className="space-y-4">
          {/* 目标文件夹 */}
          <SettingsRow
            label="目标文件夹"
            description="书签将导入到这个文件夹中"
            control={
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "max-w-[240px] truncate",
                    "text-sm font-semibold",
                    "px-3 py-2 rounded-[14px]",
                    "bg-glass-subtle border border-border-glass",
                    "text-ink"
                  )}
                  title={importTargetLabel}
                >
                  {importTargetLabel}
                </div>
                <Button
                  variant="secondary"
                  onClick={() => setImportPickerOpen(true)}
                  disabled={importing}
                >
                  选择
                </Button>
              </div>
            }
          />


          {/* 导入按钮 */}
          <div className="flex items-center gap-3 pt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".html,.htm,.json"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              variant="secondary"
              className="shadow-sm hover:shadow-md hover:border-primary/30 hover:text-primary hover:-translate-y-0.5 transition-all duration-300"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              <IconUpload className="h-4 w-4 mr-2" />
              {importing ? "导入中…" : "选择文件"}
            </Button>
            <span className="text-xs text-muted-text">支持 .html、.json 格式</span>
          </div>

          {importSuccess && (
            <div className="text-sm text-green-600 dark:text-green-400 pt-1">{importSuccess}</div>
          )}
          {importError && (
            <div className="text-sm text-red-600 dark:text-red-400 pt-1">{importError}</div>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
