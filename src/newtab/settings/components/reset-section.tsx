import { useState } from "react";
import { Button } from "@/components/ui/button";
import SettingsSection from "@/newtab/settings/components/section";
import ConfirmDialog from "@/newtab/components/confirm-dialog";
import { useResetSettings } from "@/hooks/use-reset-settings";

export default function ResetSection() {
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const { isResetting, resetError, handleReset, clearResetError } = useResetSettings();

  return (
    <>
      <SettingsSection
        title="重置"
        description="清空所有应用设置并恢复默认值，不会影响书签数据。"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="danger"
              disabled={isResetting}
              onClick={() => {
                clearResetError();
                setIsResetDialogOpen(true);
              }}
            >
              {isResetting ? "重置中…" : "重置所有设置"}
            </Button>
            <span className="text-xs text-muted-text">
              将清除固定书签、启动文件夹、搜索引擎、背景图片等设置
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* 重置确认对话框 */}
      <ConfirmDialog
        open={isResetDialogOpen}
        title="重置所有设置"
        description="此操作将清空所有应用设置（固定书签、启动文件夹、搜索引擎、背景图片等），但不会影响书签数据。确定要继续吗？"
        danger={true}
        confirmText="重置"
        cancelText="取消"
        error={resetError}
        onClose={() => {
          setIsResetDialogOpen(false);
          clearResetError();
        }}
        onConfirm={async () => {
          return await handleReset();
        }}
      />
    </>
  );
}
