// 提供书签树读取、变更监听与写回操作。
import type { BookmarkAction, BookmarkNode } from "../../shared/types";

export async function loadBookmarkTree(): Promise<BookmarkNode[]> {
  return chrome.bookmarks.getTree();
}

export async function applyBookmarkAction(action: BookmarkAction): Promise<void> {
  switch (action.type) {
    case "create":
      await chrome.bookmarks.create({
        parentId: action.parentId,
        title: action.title,
        url: action.url,
        index: action.index
      });
      return;
    case "move":
      await chrome.bookmarks.move(action.id, {
        parentId: action.parentId,
        index: action.index
      });
      return;
    case "remove":
      if (action.recursive) {
        await chrome.bookmarks.removeTree(action.id);
      } else {
        await chrome.bookmarks.remove(action.id);
      }
      return;
    case "update":
      await chrome.bookmarks.update(action.id, {
        title: action.title,
        url: action.url
      });
      return;
    default: {
      const neverAction: never = action;
      throw new Error(`未知书签操作类型: ${JSON.stringify(neverAction)}`);
    }
  }
}

type BookmarkChangeHandler = () => void;

export function subscribeBookmarkChanges(handler: BookmarkChangeHandler): () => void {
  const onCreated = () => handler();
  const onRemoved = () => handler();
  const onChanged = () => handler();
  const onMoved = () => handler();

  chrome.bookmarks.onCreated.addListener(onCreated);
  chrome.bookmarks.onRemoved.addListener(onRemoved);
  chrome.bookmarks.onChanged.addListener(onChanged);
  chrome.bookmarks.onMoved.addListener(onMoved);

  return () => {
    chrome.bookmarks.onCreated.removeListener(onCreated);
    chrome.bookmarks.onRemoved.removeListener(onRemoved);
    chrome.bookmarks.onChanged.removeListener(onChanged);
    chrome.bookmarks.onMoved.removeListener(onMoved);
  };
}
