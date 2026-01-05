// 负责后台消息路由、书签监听与缓存同步。
import { applyBookmarkAction, loadBookmarkTree, subscribeBookmarkChanges } from "../lib/bookmarks";
import { readBookmarkSnapshot, writeBookmarkSnapshot } from "../lib/storage";
import { chromeApi } from "../shared/chrome";
import { MESSAGE_TYPES } from "../shared/constants";
import type { ApplyBookmarkChangeResponse, BookmarkAction, LoadBookmarksResponse } from "../shared/types";

const isDev = import.meta.env.DEV;

const logDebug = (...args: unknown[]) => {
  if (isDev) {
    console.debug("[yew-tab]", ...args);
  }
};

const formatError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "未知错误";
};

const broadcastBookmarksChanged = () => {
  chromeApi.runtime.sendMessage({ type: MESSAGE_TYPES.BOOKMARKS_CHANGED });
};

const refreshSnapshot = async (): Promise<void> => {
  const tree = await loadBookmarkTree();
  await writeBookmarkSnapshot(tree);
};

const handleLoadBookmarks = async (): Promise<LoadBookmarksResponse> => {
  try {
    const tree = await loadBookmarkTree();
    const snapshot = await writeBookmarkSnapshot(tree);
    return {
      tree,
      updatedAt: snapshot.updatedAt,
      fromCache: false
    };
  } catch (error) {
    const cached = await readBookmarkSnapshot();
    if (cached) {
      return {
        tree: cached.tree,
        updatedAt: cached.updatedAt,
        fromCache: true,
        error: formatError(error)
      };
    }
    return {
      tree: [],
      updatedAt: new Date().toISOString(),
      fromCache: true,
      error: formatError(error)
    };
  }
};

const handleApplyChange = async (payload: BookmarkAction): Promise<ApplyBookmarkChangeResponse> => {
  try {
    await applyBookmarkAction(payload);
    await refreshSnapshot();
    broadcastBookmarksChanged();
    return { success: true };
  } catch (error) {
    return { success: false, error: formatError(error) };
  }
};

chromeApi.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return false;
  }
  if (message.type === MESSAGE_TYPES.LOAD_BOOKMARKS) {
    void handleLoadBookmarks().then(sendResponse);
    return true;
  }
  if (message.type === MESSAGE_TYPES.APPLY_BOOKMARK_CHANGE) {
    void handleApplyChange(message.payload as BookmarkAction).then(sendResponse);
    return true;
  }
  return false;
});

chromeApi.runtime.onInstalled.addListener(() => {
  void refreshSnapshot().catch((error) => logDebug("初始化缓存失败:", error));
});

subscribeBookmarkChanges(() => {
  void refreshSnapshot()
    .then(() => {
      broadcastBookmarksChanged();
    })
    .catch((error) => logDebug("书签变化同步失败:", error));
});
