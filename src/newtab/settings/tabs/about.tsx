import SettingsSection from "@/newtab/settings/components/section";
import { Button } from "@/components/ui/button";

export default function AboutTab() {
  return (
    <div className="space-y-4">
      <SettingsSection title="关于" description="版本信息与调试入口。">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-text">产品</span>
            <span className="font-semibold">Yew Tab</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-text">说明</span>
            <span className="font-semibold">自定义新标签页（书签卡片）</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-text">版本</span>
            <span className="font-mono font-semibold">{__APP_VERSION__}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-text">构建</span>
            <span className="font-mono text-xs text-muted-text">{__GIT_COMMIT__}</span>
          </div>
          <div className="border-t border-border-glass my-3" />
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                // 预留：后续可以接 chrome.storage 清理、导出导入等
              }}
            >
              预留：导出/重置
            </Button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
