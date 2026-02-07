// yew-tab JSON 备份导入
import type {
  YewTabBackup,
  ImportJsonOptions,
  ImportJsonResult,
  LayoutState,
  BackgroundSettings,
  ThemeBackground
} from "@/shared/types";
import { BACKUP_VERSION } from "@/shared/constants";
import {
  writeLayoutState,
  writeSearchSettings,
  writeBackgroundSettings
} from "@/lib/storage";

/**
 * 验证备份文件格式
 */
function validateBackup(data: unknown): { valid: boolean; error?: string; warning?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "无效的备份文件格式" };
  }

  const backup = data as Record<string, unknown>;

  if (typeof backup.version !== "number") {
    return { valid: false, error: "备份文件缺少版本号" };
  }

  if (backup.version > BACKUP_VERSION) {
    return {
      valid: true,
      warning: `备份文件版本 (${backup.version}) 高于当前支持的版本 (${BACKUP_VERSION})，部分功能可能无法正常恢复`
    };
  }

  if (!backup.data || typeof backup.data !== "object") {
    return { valid: false, error: "备份文件缺少数据内容" };
  }

  return { valid: true };
}

/**
 * 处理背景设置
 */
async function processBackgroundSettings(
  backup: YewTabBackup["data"]["backgroundSettings"]
): Promise<BackgroundSettings> {
  const processTheme = async (
    theme: YewTabBackup["data"]["backgroundSettings"]["light"]
  ): Promise<ThemeBackground> => {
    const result: ThemeBackground = {
      type: theme.type,
      imageSource: theme.imageSource,
      imagePosition: theme.imagePosition,
      overlayOpacity: theme.overlayOpacity
    };

    if (theme.imageData) {
      // URL 或其他格式，直接使用
      result.imageData = theme.imageData;
    }

    return result;
  };

  return {
    light: await processTheme(backup.light),
    dark: await processTheme(backup.dark)
  };
}

/**
 * 递归创建书签
 */
async function createBookmarksFromBackup(
  bookmarks: YewTabBackup["data"]["bookmarks"],
  parentId: string
): Promise<{ bookmarkCount: number; folderCount: number; errors: string[] }> {
  let bookmarkCount = 0;
  let folderCount = 0;
  const errors: string[] = [];

  for (const node of bookmarks) {
    try {
      if (node.children) {
        // 创建文件夹
        const folder = await chrome.bookmarks.create({
          parentId,
          title: node.title
        });
        folderCount++;

        // 递归创建子项
        const subResult = await createBookmarksFromBackup(node.children, folder.id);
        bookmarkCount += subResult.bookmarkCount;
        folderCount += subResult.folderCount;
        errors.push(...subResult.errors);
      } else if (node.url) {
        // 创建书签
        await chrome.bookmarks.create({
          parentId,
          title: node.title,
          url: node.url
        });
        bookmarkCount++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      errors.push(`创建 "${node.title}" 失败: ${msg}`);
    }
  }

  return { bookmarkCount, folderCount, errors };
}

/**
 * 导入 yew-tab 备份
 * @param backup 备份对象
 * @param options 导入选项
 * @returns 导入结果
 */
export async function importYewTabBackup(
  backup: YewTabBackup,
  options: ImportJsonOptions = {}
): Promise<ImportJsonResult> {
  const {
    importBookmarks = true,
    importSettings = true,
    targetFolderId = "1" // 默认导入到书签栏
  } = options;

  const result: ImportJsonResult = {
    success: true,
    bookmarksImported: 0,
    foldersImported: 0,
    settingsRestored: false,
    errors: [],
    warnings: []
  };

  // 验证备份格式
  const validation = validateBackup(backup);
  if (!validation.valid) {
    return {
      ...result,
      success: false,
      errors: [validation.error!]
    };
  }
  if (validation.warning) {
    result.warnings.push(validation.warning);
  }

  // 导入书签
  if (importBookmarks && backup.data.bookmarks) {
    try {
      // 验证目标文件夹
      await chrome.bookmarks.get(targetFolderId);

      // 获取书签数据（跳过根节点）
      const bookmarksToImport = backup.data.bookmarks[0]?.children ?? [];
      const importResult = await createBookmarksFromBackup(bookmarksToImport, targetFolderId);

      result.bookmarksImported = importResult.bookmarkCount;
      result.foldersImported = importResult.folderCount;
      result.errors.push(...importResult.errors);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      result.errors.push(`导入书签失败: ${msg}`);
    }
  }

  // 导入设置
  if (importSettings) {
    try {
      // 布局状态：清空 ID 引用，因为书签 ID 已经变了
      if (backup.data.layoutState) {
        const cleanLayoutState: LayoutState = {
          ...backup.data.layoutState,
          pinnedIds: [], // 清空固定书签 ID
          lastOpenFolder: null,
          startupFolderId: null, // 清空启动文件夹
          expandedFolderIds: [] // 清空展开状态
        };
        await writeLayoutState(cleanLayoutState);
      }

      // 搜索设置
      if (backup.data.searchSettings) {
        await writeSearchSettings(backup.data.searchSettings);
      }

      // 背景设置
      if (backup.data.backgroundSettings) {
        const processedSettings = await processBackgroundSettings(backup.data.backgroundSettings);
        await writeBackgroundSettings(processedSettings);
      }

      result.settingsRestored = true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      result.errors.push(`恢复设置失败: ${msg}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * 解析备份文件内容
 * @param content 文件内容字符串
 * @returns 解析后的备份对象或错误
 */
export function parseBackupFile(content: string): { backup?: YewTabBackup; error?: string } {
  try {
    const data = JSON.parse(content);
    const validation = validateBackup(data);
    if (!validation.valid) {
      return { error: validation.error };
    }
    return { backup: data as YewTabBackup };
  } catch {
    return { error: "无法解析文件，请确保是有效的 JSON 格式" };
  }
}
