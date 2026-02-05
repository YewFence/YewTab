import { useState, useCallback, useEffect } from "react";
import type { BookmarkNode } from "@/shared/types";
import { chromeApi } from "@/shared/chrome";
import { MESSAGE_TYPES } from "@/shared/constants";
import { requestBookmarks } from "@/lib/messaging";
import { readBookmarkSnapshot } from "@/lib/storage";

export function useBookmarks() {
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [offline, setOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      const response = await requestBookmarks();
      setTree(response.tree);
      setOffline(response.fromCache);
      setErrorMessage(response.error ?? null);
      return;
    } catch (error) {
      const cached = await readBookmarkSnapshot();
      if (cached) {
        setTree(cached.tree);
        setOffline(true);
        setErrorMessage("书签读取失败，已切换至离线快照");
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : "无法读取书签");
    }
  }, []);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    const handler = (message: { type?: string }) => {
      if (message?.type === MESSAGE_TYPES.BOOKMARKS_CHANGED) {
        void loadBookmarks();
      }
    };
    chromeApi.runtime.onMessage.addListener(handler);
    return () => {
      chromeApi.runtime.onMessage.removeListener(handler);
    };
  }, [loadBookmarks]);

  return { tree, offline, errorMessage, setErrorMessage, loadBookmarks };
}
