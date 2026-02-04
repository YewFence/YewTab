import SettingsSection from "@/newtab/settings/components/section";
import { Button } from "@/components/ui/button";

export default function AboutTab() {
  return (
    <div className="space-y-4">
      <SettingsSection title="关于" description="一些基础信息与调试入口。">
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-text">产品</span>
            <span className="font-semibold">Yew Tab</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-muted-text">说明</span>
            <span className="font-semibold">自定义新标签页（书签卡片）</span>
          </div>
          <div className="pt-2">
            <Button
              variant="secondary"
              onClick={() => {
                // 先留按钮位：后续可以接 chrome.storage 清理、导出导入等
                // 这里不做任何破坏性操作
              }}
            >
              预留：导出/重置
            </Button>
          </div>
          <div className="text-xs text-muted-text">（这个页面目前不依赖后端，后续可以接版本号、构建信息、反馈入口。）</div>
        </div>
      </SettingsSection>
    </div>
  );
}
