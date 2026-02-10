import { useState } from "react";
import type { BookmarkNode } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SettingsSection from "@/newtab/settings/components/section";
import SettingsRow from "@/newtab/settings/components/row";
import { IconUpload } from "@/newtab/settings/icons";
import FolderPickerDialog from "@/newtab/components/folder-picker-dialog";
import { useImportBookmarks } from "@/hooks/use-import-bookmarks";

interface ImportSectionProps {
  tree: BookmarkNode[];
}

export default function ImportSection({ tree }: ImportSectionProps) {
  const [importPickerOpen, setImportPickerOpen] = useState(false);

  const {
    importTargetId,
    importTargetLabel,
    importing,
    importError,
    importSuccess,
    fileInputRef,
    setImportTarget,
    handleFileSelect
  } = useImportBookmarks();

  return (
    <>
      {/* 导入文件夹选择器 */}
      <FolderPickerDialog
        open={importPickerOpen}
        onClose={() => setImportPickerOpen(false)}
        onConfirm={(id, title) => {
          setImportTarget(id, title);
          setImportPickerOpen(false);
        }}
        tree={tree}
        initialSelectedId={importTargetId}
        title="选择导入文件夹"
      />

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
    </>
  );
}
