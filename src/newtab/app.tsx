import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chromeApi } from "../shared/chrome";
import { MESSAGE_TYPES } from "../shared/constants";
import { applyBookmarkChange, requestBookmarks } from "../lib/messaging";
import { readBookmarkSnapshot, readLayoutState, writeLayoutState } from "../lib/storage";
import type { BookmarkAction, BookmarkNode, LayoutState } from "../shared/types";
import BookmarkCard from "./components/bookmark-card";
import FolderCard from "./components/folder-card";
import SearchBar from "./components/search-bar";

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
  
  // Navigation State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  // Inline Expansion State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState(4);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // Handle Resize for Grid Calculations
  const updateColumns = useCallback(() => {
    if (gridRef.current) {
      const gridStyle = window.getComputedStyle(gridRef.current);
      const colStr = gridStyle.gridTemplateColumns;
      // Handle "none" or empty string
      if (!colStr || colStr === "none") return;

      const colCount = colStr.split(" ").length;
      setColumns(colCount > 0 ? colCount : 1);
    }
  }, []);

  useEffect(() => {
    // Initial calculation
    // Timeout to ensure paint has happened or layout is stable
    const timer = setTimeout(updateColumns, 100);

    // Debounced resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateColumns, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      clearTimeout(resizeTimer);
    };
  }, [updateColumns, tree]); // Re-calc if tree changes (content might affect scrollbar/layout)

  const rootNodes = useMemo(() => getTopLevelNodes(tree), [tree]);
  const currentFolder = useMemo(
    () => findNodeById(rootNodes, activeFolderId),
    [rootNodes, activeFolderId]
  );
  const currentNodes = currentFolder?.children ?? rootNodes;

  // Actions
  const handleFolderClick = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubFolderOpen = async (id: string) => {
    // Navigate into the subfolder (Standard Navigation)
    setExpandedIds(new Set());
    setActiveFolderId(id);
    const nextState = { ...layout, lastOpenFolder: id };
    setLayout(nextState);
    await writeLayoutState(nextState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToRoot = async () => {
    setExpandedIds(new Set());
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

  // Grid Rendering Logic
  const renderGrid = () => {
    if (currentNodes.length === 0) {
        return (
          <div className="empty">
            <p>这里还没有书签，先在 Edge 里收藏一些吧。</p>
          </div>
        );
    }

    const items = [];

    for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        const isExpanded = expandedIds.has(node.id);

        if (node.children?.length) {
            items.push(
                <FolderCard
                    key={node.id}
                    title={getCardTitle(node)}
                    count={node.children.length}
                    isOpen={isExpanded}
                    onToggle={() => handleFolderClick(node.id)}
                    onDoubleClick={() => handleSubFolderOpen(node.id)}
                    childrenNodes={node.children}
                    onSubFolderClick={handleSubFolderOpen}
                />
            );
        } else {
            items.push(
                <BookmarkCard
                    key={node.id}
                    title={getCardTitle(node)}
                    url={node.url ?? ""}
                />
            );
        }
    }
    return items;
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand__title">Yew Tab</span>
          <span className="brand__subtitle">书签一眼可见</span>
        </div>
        
        {activeFolderId && (
            <button className="ghost-button" onClick={handleBackToRoot} type="button" style={{ marginRight: 'auto', marginLeft: '20px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                  <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              返回上级
            </button>
        )}

        <SearchBar />
        <div className="status">
          {offline && <span className="badge badge--warning">离线快照</span>}
          <button className="primary-button" onClick={handleCreateQuickBookmark} type="button">
            快速新增
          </button>
        </div>
      </header>

      {errorMessage && <div className="alert">{errorMessage}</div>}

      <section className="grid" ref={gridRef}>
        {renderGrid()}
      </section>
    </div>
  );
}
