import { useState } from "react";
import type { BookmarkNode } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Radio } from "@/components/ui/radio";
import { cn } from "@/lib/utils";
import SettingsSection from "@/newtab/settings/components/section";
import SettingsRow from "@/newtab/settings/components/row";
import { IconDownload } from "@/newtab/settings/icons";
import FolderPickerDialog from "@/newtab/components/folder-picker-dialog";
import { useExportBookmarks } from "@/hooks/use-export-bookmarks";

interface ExportSectionProps {
  bookmarks: BookmarkNode[];
  tree: BookmarkNode[];
}

export default function ExportSection({ bookmarks, tree }: ExportSectionProps) {
  const [exportPickerOpen, setExportPickerOpen] = useState(false);

  const {
    exportFormat,
    exportRootId,
    exportRootLabel,
    exporting,
    exportError,
    exportSuccess,
    setExportFormat,
    setExportRoot,
    handleExport
  } = useExportBookmarks(bookmarks);

  return (
    <>
      {/* 导出文件夹选择器 */}
      <FolderPickerDialog
        open={exportPickerOpen}
        onClose={() => setExportPickerOpen(false)}
        onConfirm={(id, title) => {
          setExportRoot(id, title);
          setExportPickerOpen(false);
        }}
        tree={tree}
        initialSelectedId={exportRootId || "0"} // 默认为 "0" (全部书签)
        title="选择导出文件夹"
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
    </>
  );
}
