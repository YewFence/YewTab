import { useCallback, useState } from "react";
import { chromeApi } from "@/shared/chrome";
import { STORAGE_KEYS } from "@/shared/constants";

export interface UseResetSettingsReturn {
  // 状态
  isResetting: boolean;
  resetError: string | null;

  // 操作方法
  handleReset: () => Promise<boolean>;
  clearResetError: () => void;
}

/**
 * 重置所有应用设置的 Hook
 * 会清除布局状态、搜索设置、背景设置，但不影响书签数据
 */
export function useResetSettings(): UseResetSettingsReturn {
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleReset = useCallback(async (): Promise<boolean> => {
    setResetError(null);
    setIsResetting(true);

    try {
      // 清除所有设置（不删除书签快照）
      await chromeApi.storage.local.remove([
        STORAGE_KEYS.LAYOUT,           // 布局状态：固定书签、启动文件夹、展开状态等
        STORAGE_KEYS.SEARCH_SETTINGS,   // 搜索引擎设置
        STORAGE_KEYS.BACKGROUND_SETTINGS // 背景图片和主题设置
      ]);

      // 延迟刷新，让用户看到操作完成
      setTimeout(() => window.location.reload(), 500);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "重置失败";
      setResetError(msg);
      setIsResetting(false);
      return false;
    }
  }, []);

  const clearResetError = useCallback(() => {
    setResetError(null);
  }, []);

  return {
    isResetting,
    resetError,
    handleReset,
    clearResetError
  };
}
