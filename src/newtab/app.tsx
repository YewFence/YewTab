import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
          <div className="text-center py-12 text-muted-text">
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
    <div className="px-[clamp(20px,5vw,60px)] py-10 max-w-[1600px] mx-auto w-full flex-1">
      <header className="flex items-center justify-between gap-6 mb-10 flex-wrap">
        <div>
          <span className="text-[28px] font-bold tracking-tight block">Yew Tab</span>
          <span className="text-sm text-muted-text font-medium">书签一眼可见</span>
        </div>

        {activeFolderId && (
            <button
              className={cn(
                "mr-auto ml-5 bg-transparent border-none cursor-pointer",
                "text-muted-text hover:text-ink flex items-center"
              )}
              onClick={handleBackToRoot}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1.5 align-middle">
                  <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              返回上级
            </button>
        )}

        <SearchBar />
        <div className="flex gap-3">
          {offline && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              离线快照
            </span>
          )}
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded-[12px] font-semibold cursor-pointer border-none"
            onClick={handleCreateQuickBookmark}
            type="button"
          >
            快速新增
          </button>
        </div>
      </header>

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6">
          {errorMessage}
        </div>
      )}

      <section
        className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6 relative [grid-auto-flow:row_dense]"
        ref={gridRef}
      >
        {renderGrid()}
      </section>
    </div>
  );
}
