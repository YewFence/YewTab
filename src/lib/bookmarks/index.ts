// 提供书签树读取、变更监听与写回操作。
import { chromeApi } from "../../shared/chrome";
import type { BookmarkAction, BookmarkNode } from "../../shared/types";

export async function reorderBookmarkChildren(payload: { parentId: string; orderedIds: string[] }): Promise<void> {
  const parentId = payload.parentId;
  const orderedIds = payload.orderedIds ?? [];

  const children = await chromeApi.bookmarks.getChildren(parentId);
  const currentIds = children.map((c) => c.id);

  if (currentIds.length <= 1) {
    return;
  }

  const existing = new Set(currentIds);
  const seen = new Set<string>();
  const nextOrder: string[] = [];

  for (const id of orderedIds) {
    if (!existing.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    nextOrder.push(id);
  }
  for (const id of currentIds) {
    if (!seen.has(id)) {
      nextOrder.push(id);
    }
  }

  // 逐个设置 index，最终收敛到目标顺序。
  for (let index = 0; index < nextOrder.length; index++) {
    await chromeApi.bookmarks.move(nextOrder[index], { parentId, index });
  }
}

export async function loadBookmarkTree(): Promise<BookmarkNode[]> {
  return chromeApi.bookmarks.getTree();
}

export async function applyBookmarkAction(action: BookmarkAction): Promise<void> {
  switch (action.type) {
    case "create":
      await chromeApi.bookmarks.create({
        parentId: action.parentId,
        title: action.title,
        url: action.url,
        index: action.index
      });
      return;
    case "move":
      await chromeApi.bookmarks.move(action.id, {
        parentId: action.parentId,
        index: action.index
      });
      return;
    case "remove":
      // 当前版本：不允许删除任何文件夹（无论是否递归）。
      // 仅允许删除「书签」节点。
      try {
        const nodes = await chromeApi.bookmarks.get(action.id);
        const node = nodes?.[0];
        const isFolder = !node?.url;
        if (isFolder) {
          throw new Error("当前版本不支持删除文件夹");
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("删除前校验失败");
      }

      await chromeApi.bookmarks.remove(action.id);
      return;
    case "update":
      await chromeApi.bookmarks.update(action.id, {
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

  chromeApi.bookmarks.onCreated.addListener(onCreated);
  chromeApi.bookmarks.onRemoved.addListener(onRemoved);
  chromeApi.bookmarks.onChanged.addListener(onChanged);
  chromeApi.bookmarks.onMoved.addListener(onMoved);

  return () => {
    chromeApi.bookmarks.onCreated.removeListener(onCreated);
    chromeApi.bookmarks.onRemoved.removeListener(onRemoved);
    chromeApi.bookmarks.onChanged.removeListener(onChanged);
    chromeApi.bookmarks.onMoved.removeListener(onMoved);
  };
}
