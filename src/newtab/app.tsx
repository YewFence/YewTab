import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { chromeApi } from "../shared/chrome";
import { MESSAGE_TYPES } from "../shared/constants";
import { applyBookmarkChange, requestBookmarks } from "../lib/messaging";
import { readBookmarkSnapshot, readLayoutState, writeLayoutState } from "../lib/storage";
import type { BookmarkAction, BookmarkNode, LayoutState } from "../shared/types";
import BookmarkCard from "./components/bookmark-card";
import BackCard from "./components/back-card";
import FolderCard from "./components/folder-card";
import SearchBar from "./components/search-bar";
import ContextMenu, { type ContextMenuItem } from "./components/context-menu";
import EditBookmarkDialog from "./components/edit-bookmark-dialog";
import ConfirmDialog from "./components/confirm-dialog";
import type { ContextMenuTarget } from "./types";

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
  const folderClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [contextMenu, setContextMenu] = useState<
    | {
        x: number;
        y: number;
        target: ContextMenuTarget;
      }
    | null
  >(null);
  const [editTarget, setEditTarget] = useState<ContextMenuTarget | null>(null);
  const [editServerError, setEditServerError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Extract<ContextMenuTarget, { kind: "bookmark" }> | null>(null);
  const [deleteServerError, setDeleteServerError] = useState<string | null>(null);

  const suppressReactContextMenuRef = useRef(0);
  
  // Navigation State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  // Inline Expansion State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState(4);
  const gridRef = useRef<HTMLDivElement>(null);

  const [offline, setOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const openContextMenu = useCallback((event: MouseEvent, target: ContextMenuTarget) => {
    if (Date.now() - suppressReactContextMenuRef.current < 50) {
      return;
    }
    setContextMenu({ x: event.clientX, y: event.clientY, target });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // 某些浏览器/扩展页面环境下，React 的 onContextMenu preventDefault 可能不生效。
  // 这里用原生捕获阶段统一兜底拦截，并根据卡片上的 data 属性打开自定义菜单。
  useEffect(() => {
    const handler = (event: globalThis.MouseEvent) => {
      const targetEl = event.target as HTMLElement | null;
      if (!targetEl) {
        return;
      }
      const el = targetEl.closest("[data-yew-context]") as HTMLElement | null;
      if (!el) {
        return;
      }

      const kind = el.dataset.yewContext;
      const id = el.dataset.yewId;
      const title = el.dataset.yewTitle ?? "";
      if (!kind || !id) {
        return;
      }

      let ctxTarget: ContextMenuTarget | null = null;
      if (kind === "folder") {
        ctxTarget = { kind: "folder", id, title };
      } else if (kind === "bookmark") {
        const url = el.dataset.yewUrl ?? "";
        ctxTarget = { kind: "bookmark", id, title, url };
      }
      if (!ctxTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      // 尽量阻断后续监听（包括 React 的 delegated listener）。
      (event as unknown as { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      suppressReactContextMenuRef.current = Date.now();

      setContextMenu({ x: event.clientX, y: event.clientY, target: ctxTarget });
    };

    window.addEventListener("contextmenu", handler, { capture: true });
    return () => window.removeEventListener("contextmenu", handler, { capture: true } as AddEventListenerOptions);
  }, []);

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
    return () => {
      if (folderClickTimerRef.current) {
        clearTimeout(folderClickTimerRef.current);
        folderClickTimerRef.current = null;
      }
    };
  }, []);

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

  const clearFolderClickTimer = () => {
    if (folderClickTimerRef.current) {
      clearTimeout(folderClickTimerRef.current);
      folderClickTimerRef.current = null;
    }
  };

  const handleFolderToggleGesture = (id: string, isOpen: boolean) => {
    // If already open, close immediately (collapse card shouldn't feel delayed).
    if (isOpen) {
      clearFolderClickTimer();
      handleFolderClick(id);
      return;
    }

    // Delay single-click expand slightly so double-click can be detected reliably.
    clearFolderClickTimer();
    folderClickTimerRef.current = setTimeout(() => {
      folderClickTimerRef.current = null;
      handleFolderClick(id);
    }, 220);
  };

  const handleSubFolderOpen = async (id: string) => {
    // Navigate into the subfolder (Standard Navigation)
    clearFolderClickTimer();
    setExpandedIds(new Set());
    setActiveFolderId(id);
    const nextState = { ...layout, lastOpenFolder: id };
    setLayout(nextState);
    await writeLayoutState(nextState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToRoot = async () => {
    clearFolderClickTimer();
    setExpandedIds(new Set());
    setActiveFolderId(null);
    const nextState = { ...layout, lastOpenFolder: null };
    setLayout(nextState);
    await writeLayoutState(nextState);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) {
      return [];
    }

    const t = contextMenu.target;
    if (t.kind === "folder") {
      return [
        {
          key: "edit",
          label: "重命名...",
          onSelect: () => {
            setEditServerError(null);
            setEditTarget(t);
            closeContextMenu();
          }
        },
        {
          key: "delete",
          label: "删除文件夹（暂不支持）",
          disabled: true,
          danger: true,
          onSelect: () => undefined
        }
      ];
    }

    return [
      {
        key: "edit",
        label: "编辑...",
        onSelect: () => {
          setEditServerError(null);
          setEditTarget(t);
          closeContextMenu();
        }
      },
      {
        key: "delete",
        label: "删除...",
        danger: true,
        onSelect: () => {
          setDeleteServerError(null);
          setDeleteTarget(t);
          closeContextMenu();
        }
      }
    ];
  }, [contextMenu, closeContextMenu]);

  // Grid Rendering Logic
  const renderGrid = () => {
    const items = [];

     if (activeFolderId) {
       items.push(
         <BackCard
           key="__back__"
           title={currentFolder ? getCardTitle(currentFolder) : "返回上级"}
           subtitle="返回上级"
           onClick={() => {
             void handleBackToRoot();
           }}
         />
       );
     }

     if (currentNodes.length === 0) {
       items.push(
         <div key="__empty__" className="col-span-full text-center py-12 text-muted-text">
           <p>这里还没有书签，先在 Edge 里收藏一些吧。</p>
         </div>
       );
       return items;
     }

    for (let i = 0; i < currentNodes.length; i++) {
        const node = currentNodes[i];
        const isExpanded = expandedIds.has(node.id);

        if (node.children?.length) {
            items.push(
                <FolderCard
                    key={node.id}
                    id={node.id}
                    title={getCardTitle(node)}
                    count={node.children.length}
                    isOpen={isExpanded}
                    onToggle={() => handleFolderToggleGesture(node.id, isExpanded)}
                    onDoubleClick={() => {
                      clearFolderClickTimer();
                      void handleSubFolderOpen(node.id);
                    }}
                    childrenNodes={node.children}
                    onSubFolderClick={handleSubFolderOpen}
                    onContextMenu={openContextMenu}
                />
            );
        } else {
            items.push(
                <BookmarkCard
                    key={node.id}
                    id={node.id}
                    title={getCardTitle(node)}
                    url={node.url ?? ""}
                    onContextMenu={openContextMenu}
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

      <ContextMenu
        open={!!contextMenu}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenuItems}
        onClose={closeContextMenu}
      />

      <EditBookmarkDialog
        open={!!editTarget}
        target={editTarget}
        serverError={editServerError}
        onClose={() => {
          setEditTarget(null);
          setEditServerError(null);
        }}
        onSubmit={async (payload) => {
          if (!editTarget) {
            return false;
          }

          const action: BookmarkAction =
            editTarget.kind === "folder"
              ? {
                  type: "update",
                  id: editTarget.id,
                  title: payload.title
                }
              : {
                  type: "update",
                  id: editTarget.id,
                  title: payload.title,
                  url: payload.url
                };

          const response = await applyBookmarkChange(action);
          if (!response.success) {
            const msg = response.error ?? "写回书签失败";
            setEditServerError(msg);
            setErrorMessage(msg);
            return false;
          }
          return true;
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除书签？"
        description={deleteTarget ? `即将删除“${deleteTarget.title || "未命名"}”。此操作无法撤销。` : undefined}
        error={deleteServerError}
        confirmText="删除"
        danger
        onClose={() => {
          setDeleteTarget(null);
          setDeleteServerError(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return false;
          }
          const response = await applyBookmarkChange({ type: "remove", id: deleteTarget.id });
          if (!response.success) {
            const msg = response.error ?? "删除失败";
            setDeleteServerError(msg);
            setErrorMessage(msg);
            return false;
          }
          return true;
        }}
      />
    </div>
  );
}
