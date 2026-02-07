// yew-tab JSON 完整备份导出
import type {
  BookmarkNode,
  LayoutState,
  SearchSettings,
  BackgroundSettings,
  BackgroundSettingsBackup,
  ThemeBackgroundBackup,
  YewTabBackup
} from "@/shared/types";
import { BACKUP_VERSION } from "@/shared/constants";

/**
 * 处理主题背景设置
 */
async function processThemeBackground(
  theme: BackgroundSettings["light"] | BackgroundSettings["dark"]
): Promise<ThemeBackgroundBackup> {
  const result: ThemeBackgroundBackup = {
    type: theme.type,
    imageSource: theme.imageSource,
    imagePosition: theme.imagePosition,
    overlayOpacity: theme.overlayOpacity
  };

  if (theme.imageData) {
    // 已经是 URL 或 Base64，直接使用
    result.imageData = theme.imageData;
    result.imageEmbedded = theme.imageData.startsWith("data:");
  }

  return result;
}

/**
 * 导出 yew-tab 完整备份
 * @param bookmarks 书签树
 * @param layoutState 布局状态
 * @param searchSettings 搜索设置
 * @param backgroundSettings 背景设置
 * @returns 备份对象
 */
export async function exportYewTabBackup(
  bookmarks: BookmarkNode[],
  layoutState: LayoutState,
  searchSettings: SearchSettings,
  backgroundSettings: BackgroundSettings
): Promise<YewTabBackup> {
  // 处理背景设置，嵌入图片
  const processedBackgroundSettings: BackgroundSettingsBackup = {
    light: await processThemeBackground(backgroundSettings.light),
    dark: await processThemeBackground(backgroundSettings.dark)
  };

  const backup: YewTabBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "unknown",
    data: {
      bookmarks,
      layoutState,
      searchSettings,
      backgroundSettings: processedBackgroundSettings
    }
  };

  return backup;
}

/**
 * 将备份对象序列化为 JSON 字符串
 */
export function serializeBackup(backup: YewTabBackup): string {
  return JSON.stringify(backup, null, 2);
}
