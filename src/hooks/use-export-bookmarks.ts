import { useCallback, useState } from "react";
import type { BookmarkNode } from "@/shared/types";
import {
  exportBookmarksToHtml,
  exportYewTabBackup,
  serializeBackup,
  downloadFile
} from "@/lib/import-export";
import {
  readLayoutState,
  readSearchSettings,
  readBackgroundSettings
} from "@/lib/storage";

export type ExportFormat = "html" | "json";

export interface UseExportBookmarksReturn {
  // 状态
  exportFormat: ExportFormat;
  exportRootId: string;
  exportRootLabel: string;
  exporting: boolean;
  exportError: string | null;
  exportSuccess: string | null;

  // 操作方法
  setExportFormat: (format: ExportFormat) => void;
  setExportRoot: (id: string, label: string) => void;
  handleExport: () => Promise<void>;
  clearExportMessages: () => void;
}

/**
 * 书签导出功能的 Hook
 * 支持导出为 HTML（浏览器通用格式）或 JSON（完整备份格式）
 */
export function useExportBookmarks(bookmarks: BookmarkNode[]): UseExportBookmarksReturn {
  const [exportFormat, setExportFormat] = useState<ExportFormat>("html");
  const [exportRootId, setExportRootId] = useState<string>("");
  const [exportRootLabel, setExportRootLabel] = useState<string>("全部书签");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const setExportRoot = useCallback((id: string, label: string) => {
    setExportRootId(id);
    setExportRootLabel(label);
  }, []);

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

  const clearExportMessages = useCallback(() => {
    setExportError(null);
    setExportSuccess(null);
  }, []);

  return {
    exportFormat,
    exportRootId,
    exportRootLabel,
    exporting,
    exportError,
    exportSuccess,
    setExportFormat,
    setExportRoot,
    handleExport,
    clearExportMessages
  };
}
