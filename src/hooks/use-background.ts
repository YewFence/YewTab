import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { readBackgroundSettings } from "@/lib/storage";
import type { BackgroundSettings, ImagePosition } from "@/shared/types";

// 背景设置变更事件名
export const BACKGROUND_CHANGED_EVENT = "background-settings-changed";

/**
 * 背景状态管理 Hook
 * 负责读取背景设置并应用到页面
 */
export function useBackground() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<BackgroundSettings | null>(null);

  // 获取当前实际主题（处理 system）
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  // 加载设置
  useEffect(() => {
    void readBackgroundSettings().then(setSettings);
  }, []);

  // 监听设置变更事件
  useEffect(() => {
    const handler = () => {
      void readBackgroundSettings().then(setSettings);
    };
    window.addEventListener(BACKGROUND_CHANGED_EVENT, handler);
    return () => window.removeEventListener(BACKGROUND_CHANGED_EVENT, handler);
  }, []);

  // 监听系统主题变化（当 theme === "system" 时）
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      // 强制重新应用背景
      void readBackgroundSettings().then(setSettings);
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  // 应用背景样式
  useEffect(() => {
    if (!settings) return;

    const bg = settings[resolvedTheme];
    const root = document.documentElement;

    if (bg.type === "gradient" || !bg.imageData) {
      // 使用默认渐变
      root.style.removeProperty("--custom-bg-image");
      root.style.removeProperty("--custom-bg-size");
      root.style.removeProperty("--custom-bg-repeat");
      root.style.removeProperty("--custom-bg-overlay");
      root.classList.remove("custom-bg-active");
    } else {
      // 使用自定义图片
      root.style.setProperty("--custom-bg-image", `url("${bg.imageData}")`);
      root.style.setProperty("--custom-bg-size", getSizeValue(bg.imagePosition));
      root.style.setProperty("--custom-bg-repeat", getRepeatValue(bg.imagePosition));
      root.style.setProperty("--custom-bg-overlay", String(bg.overlayOpacity ?? 30));
      root.classList.add("custom-bg-active");
    }
  }, [settings, resolvedTheme]);

  return { settings, resolvedTheme };
}

function getSizeValue(position?: ImagePosition): string {
  switch (position) {
    case "contain":
      return "contain";
    case "center":
      return "auto";
    case "tile":
      return "auto";
    default:
      return "cover";
  }
}

function getRepeatValue(position?: ImagePosition): string {
  return position === "tile" ? "repeat" : "no-repeat";
}
