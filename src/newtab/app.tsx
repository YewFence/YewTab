// 负责渲染书签卡片网格与交互状态。
import { useCallback, useEffect, useMemo, useState } from "react";
import { chromeApi } from "../shared/chrome";
import { MESSAGE_TYPES } from "../shared/constants";
import { applyBookmarkChange, requestBookmarks } from "../lib/messaging";
import { readBookmarkSnapshot, readLayoutState, writeLayoutState } from "../lib/storage";
import type { BookmarkAction, BookmarkNode, LayoutState } from "../shared/types";
import BookmarkCard from "./components/bookmark-card";
import FolderCard from "./components/folder-card";

const emptyLayout: LayoutState = {
  pinnedIds: [],
  lastOpenFolder: null
};

const findNodeById = (nodes: BookmarkNode[], id: string | null): BookmarkNode | null => {
  if (!id) {
    return null;
  }
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

const getTopLevelNodes = (tree: BookmarkNode[]): BookmarkNode[] => {
  return tree[0]?.children ?? [];
};

const getCardTitle = (node: BookmarkNode): string => {
  return node.title || (node.url ?? "未命名");
};

export default function App() {
  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [layout, setLayout] = useState<LayoutState>(emptyLayout);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      const response = await requestBookmarks();
      setTree(response.tree);
      setLastUpdated(response.updatedAt);
      setOffline(response.fromCache);
      setErrorMessage(response.error ?? null);
      return;
    } catch (error) {
      const cached = await readBookmarkSnapshot();
      if (cached) {
        setTree(cached.tree);
        setLastUpdated(cached.updatedAt);
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
    void readLayoutState().then((state) => {
      setLayout(state);
      if (state.lastOpenFolder) {
        setActiveFolderId(state.lastOpenFolder);
      }
    });
  }, []);

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

  const rootNodes = useMemo(() => getTopLevelNodes(tree), [tree]);
  const currentFolder = useMemo(
    () => findNodeById(rootNodes, activeFolderId),
    [rootNodes, activeFolderId]
  );
  const currentNodes = currentFolder?.children ?? rootNodes;

  const handleOpenFolder = async (id: string) => {
    setActiveFolderId(id);
    const nextState = { ...layout, lastOpenFolder: id };
    setLayout(nextState);
    await writeLayoutState(nextState);
  };

  const handleBackToRoot = async () => {
    setActiveFolderId(null);
    const nextState = { ...layout, lastOpenFolder: null };
    setLayout(nextState);
    await writeLayoutState(nextState);
  };

  const handleCreateQuickBookmark = async () => {
    const action: BookmarkAction = {
      type: "create",
      parentId: (currentFolder ?? rootNodes[0])?.id ?? "0",
      title: "未命名书签",
      url: "https://www.example.com"
    };
    const response = await applyBookmarkChange(action);
    if (!response.success) {
      setErrorMessage(response.error ?? "写回书签失败");
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand__title">Yew Tab</span>
          <span className="brand__subtitle">书签一眼可见</span>
        </div>
        <div className="status">
          {offline && <span className="badge badge--warning">离线快照</span>}
          {lastUpdated && (
            <span className="badge badge--ghost">更新于 {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
          {activeFolderId && (
            <button className="ghost-button" onClick={handleBackToRoot} type="button">
              返回根目录
            </button>
          )}
          <button className="primary-button" onClick={handleCreateQuickBookmark} type="button">
            快速新增
          </button>
        </div>
      </header>

      {errorMessage && <div className="alert">{errorMessage}</div>}

      <section className="grid">
        {currentNodes.length === 0 && (
          <div className="empty">
            <p>这里还没有书签，先在 Edge 里收藏一些吧。</p>
          </div>
        )}
        {currentNodes.map((node) =>
          node.children?.length ? (
            <FolderCard
              key={node.id}
              title={getCardTitle(node)}
              count={node.children.length}
              onOpen={() => void handleOpenFolder(node.id)}
            />
          ) : (
            <BookmarkCard
              key={node.id}
              title={getCardTitle(node)}
              url={node.url ?? ""}
            />
          )
        )}
      </section>
    </div>
  );
}
