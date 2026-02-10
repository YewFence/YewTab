import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  importBookmarksFromHtml,
  importYewTabBackup,
  parseBackupFile
} from "@/lib/import-export";

export interface UseImportBookmarksReturn {
  // 状态
  importTargetId: string;
  importTargetLabel: string;
  importing: boolean;
  importError: string | null;
  importSuccess: string | null;
  fileInputRef: RefObject<HTMLInputElement>;

  // 操作方法
  setImportTarget: (id: string, label: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  clearImportMessages: () => void;
}

/**
 * 书签导入功能的 Hook
 * 支持导入 HTML（浏览器导出格式）或 JSON（Yew Tab 备份格式）
 */
export function useImportBookmarks(): UseImportBookmarksReturn {
  const [importTargetId, setImportTargetId] = useState<string>("1"); // 默认为书签栏
  const [importTargetLabel, setImportTargetLabel] = useState<string>("书签栏");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const setImportTarget = useCallback((id: string, label: string) => {
    setImportTargetId(id);
    setImportTargetLabel(label);
  }, []);

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

  const clearImportMessages = useCallback(() => {
    setImportError(null);
    setImportSuccess(null);
  }, []);

  return {
    importTargetId,
    importTargetLabel,
    importing,
    importError,
    importSuccess,
    fileInputRef,
    setImportTarget,
    handleFileSelect,
    clearImportMessages
  };
}
