import { useState, useEffect, useCallback, useRef } from "react";
import { readBackgroundSettings, writeBackgroundSettings } from "@/lib/storage";
import { compressImageToBase64, estimateBase64SizeMB, isValidImageUrl } from "@/lib/storage/image-utils";
import { BACKGROUND_CHANGED_EVENT } from "@/hooks/use-background";
import type { BackgroundSettings, ThemeBackground, ImagePosition } from "@/shared/types";
import SettingsSection from "./section";
import SettingsRow from "./row";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio } from "@/components/ui/radio";
import { cn } from "@/lib/utils";

type EditingMode = "light" | "dark";

const POSITION_OPTIONS: { value: ImagePosition; label: string }[] = [
  { value: "cover", label: "铺满（裁切）" },
  { value: "contain", label: "适应（留白）" },
  { value: "center", label: "居中" },
  { value: "tile", label: "平铺" }
];

export default function BackgroundSection() {
  const [settings, setSettings] = useState<BackgroundSettings | null>(null);
  const [editingMode, setEditingMode] = useState<EditingMode>("light");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载设置
  useEffect(() => {
    void readBackgroundSettings().then(setSettings);
  }, []);

  // 当前编辑的背景配置
  const currentBg = settings?.[editingMode];

  // 更新设置并触发事件
  const updateBackground = useCallback(
    async (updates: Partial<ThemeBackground>) => {
      if (!settings) return;
      const newSettings: BackgroundSettings = {
        ...settings,
        [editingMode]: { ...settings[editingMode], ...updates }
      };
      setSettings(newSettings);
      await writeBackgroundSettings(newSettings);
      window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGED_EVENT));
    },
    [settings, editingMode]
  );

  // 处理图片上传
  const handleFileUpload = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const base64 = await compressImageToBase64(file);
      await updateBackground({
        type: "image",
        imageSource: "upload",
        imageData: base64
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
    }
  };

  // 处理 URL 输入
  const handleUrlSubmit = async () => {
    const url = urlInput.trim();
    if (!url) return;

    if (!isValidImageUrl(url)) {
      setError("请输入有效的图片 URL（以 http:// 或 https:// 开头）");
      return;
    }

    setError(null);
    await updateBackground({
      type: "image",
      imageSource: "url",
      imageData: url
    });
    setUrlInput("");
  };

  // 重置为默认
  const handleReset = async () => {
    await updateBackground({
      type: "gradient",
      imageSource: undefined,
      imageData: undefined
    });
  };

  if (!settings) {
    return (
      <SettingsSection title="背景" description="加载中...">
        <div className="text-muted-text">加载中...</div>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection title="背景" description="为浅色和深色模式分别设置背景图片">
      {/* 模式切换标签 */}
      <div className="flex gap-2 mb-4">
        {(["light", "dark"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className={cn(
              "px-4 py-2 rounded-[12px] text-sm font-semibold transition-all",
              editingMode === mode
                ? "bg-primary/10 text-primary border border-primary/30"
                : "bg-glass border border-border-glass text-muted-text hover:bg-glass-strong"
            )}
            onClick={() => setEditingMode(mode)}
          >
            {mode === "light" ? "浅色模式" : "深色模式"}
          </button>
        ))}
      </div>

      {/* 背景类型选择 */}
      <SettingsRow
        label="背景类型"
        description="选择使用默认渐变或自定义图片"
        control={
          <div className="flex gap-2">
            {[
              { value: "gradient", label: "渐变" },
              { value: "image", label: "图片" }
            ].map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "inline-flex items-center gap-2 px-3 h-10 rounded-[14px] cursor-pointer border transition-all",
                  currentBg?.type === opt.value
                    ? "bg-primary/5 border-primary/30 text-primary"
                    : "bg-glass-subtle border-border-glass text-ink hover:bg-glass"
                )}
              >
                <Radio
                  name={`bg-type-${editingMode}`}
                  checked={currentBg?.type === opt.value}
                  onChange={() => updateBackground({ type: opt.value as "gradient" | "image" })}
                />
                <span className="text-sm font-semibold">{opt.label}</span>
              </label>
            ))}
          </div>
        }
      />

      {/* 图片设置区域（仅当选择图片时显示） */}
      {currentBg?.type === "image" && (
        <div className="mt-4 space-y-4">
          {/* 上传按钮 */}
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="secondary"
              className="flex-1"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? "上传中..." : "上传图片"}
            </Button>
          </div>

          {/* URL 输入 */}
          <div className="flex gap-2">
            <Input
              placeholder="或输入图片 URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <Button variant="secondary" onClick={handleUrlSubmit}>
              确定
            </Button>
          </div>

          {/* 图片预览 */}
          {currentBg?.imageData && (
            <div className="relative rounded-[14px] overflow-hidden border border-border-glass aspect-video bg-glass">
              <img
                src={currentBg.imageData}
                alt="背景预览"
                className="w-full h-full object-cover"
                onError={() => setError("图片加载失败")}
              />
              <div className="absolute bottom-2 right-2 text-xs bg-black/50 text-white px-2 py-1 rounded">
                {currentBg.imageSource === "upload"
                  ? `${estimateBase64SizeMB(currentBg.imageData).toFixed(1)} MB`
                  : "URL 图片"}
              </div>
            </div>
          )}

          {/* 图片位置 */}
          <SettingsRow
            label="图片显示方式"
            control={
              <select
                className="h-10 px-3 rounded-[14px] bg-glass border border-border-glass text-ink"
                value={currentBg?.imagePosition ?? "cover"}
                onChange={(e) => updateBackground({ imagePosition: e.target.value as ImagePosition })}
              >
                {POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            }
          />

          {/* 叠加层透明度 */}
          <SettingsRow
            label="叠加层透明度"
            description="增加透明度可提高内容可读性"
            control={
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={currentBg?.overlayOpacity ?? 30}
                  onChange={(e) => updateBackground({ overlayOpacity: Number(e.target.value) })}
                  className="w-24"
                />
                <span className="text-sm text-muted-text w-8">{currentBg?.overlayOpacity ?? 30}%</span>
              </div>
            }
          />
        </div>
      )}

      {/* 错误提示 */}
      {error && <div className="mt-3 text-sm text-destructive">{error}</div>}

      {/* 重置按钮 */}
      {currentBg?.type === "image" && currentBg?.imageData && (
        <div className="mt-4 pt-4 border-t border-border-glass">
          <Button variant="ghost" onClick={handleReset}>
            重置为默认渐变背景
          </Button>
        </div>
      )}
    </SettingsSection>
  );
}
