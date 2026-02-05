import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { chromeApi } from "../shared/chrome";
import { MESSAGE_TYPES } from "../shared/constants";
import { applyBookmarkChange, reorderBookmarkChildren, requestBookmarks } from "../lib/messaging";
import { readBookmarkSnapshot, readLayoutState, writeLayoutState } from "../lib/storage";
import type { BookmarkAction, BookmarkNode, LayoutState } from "../shared/types";
import BookmarkCard from "./components/bookmark-card";
import BackCard from "./components/back-card";
import FolderCard from "./components/folder-card";
import SortableGrid from "./components/sortable-grid";
import SearchBar from "./components/search-bar";
import ContextMenu, { type ContextMenuItem } from "./components/context-menu";
import EditBookmarkDialog from "./components/edit-bookmark-dialog";
import ConfirmDialog from "./components/confirm-dialog";
import CreateFolderDialog from "./components/create-folder-dialog";
import Breadcrumb from "./components/breadcrumb";
import type { ContextMenuTarget } from "./types";
import SettingsModal from "@/newtab/settings";
import { IconEdit, IconSettings } from "@/newtab/settings/icons";
import { Button } from "@/components/ui/button";
import { useBackground } from "@/hooks/use-background";

const emptyLayout: LayoutState = {
  pinnedIds: [],
  lastOpenFolder: null,
  startupFolderId: null
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

const findPathInTree = (node: BookmarkNode, targetId: string): BookmarkNode[] | null => {
  if (node.id === targetId) {
    return [node];
  }
  const children = node.children ?? [];
  for (const child of children) {
    const sub = findPathInTree(child, targetId);
    if (sub) {
      return [node, ...sub];
    }
  }
  return null;
};

export default function App() {
  // 初始化背景设置
  useBackground();

  const [tree, setTree] = useState<BookmarkNode[]>([]);
  const [layout, setLayout] = useState<LayoutState>(emptyLayout);
  const folderClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editMode, setEditMode] = useState(false);

  const [orderedIds, setOrderedIds] = useState<string[]>([]);
  const reorderRequestIdRef = useRef(0);

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

  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [createFolderServerError, setCreateFolderServerError] = useState<string | null>(null);

  const suppressReactContextMenuRef = useRef(0);
  
  // Navigation State
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  // Inline Expansion State
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState(4);
  const gridRef = useRef<HTMLDivElement>(null);

  const [offline, setOffline] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const layoutRef = useRef(layout);
  layoutRef.current = layout;

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
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey) {
        return;
      }
      if (e.key?.toLowerCase() !== "e") {
        return;
      }
      e.preventDefault();
      setEditMode((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    void readLayoutState().then((state) => {
      setLayout(state);
      if (state.startupFolderId) {
        setActiveFolderId(state.startupFolderId);
        return;
      }
      if (state.lastOpenFolder) {
        setActiveFolderId(state.lastOpenFolder);
      }
    });
  }, []);

  useEffect(() => {
    // 启动文件夹如果被删除/移动导致不可达，则自动清除。
    if (!tree.length) {
      return;
    }
    const startupId = layout.startupFolderId;
    if (!startupId) {
      return;
    }
    const rootNodes = getTopLevelNodes(tree);
    const found = findNodeById(rootNodes, startupId);
    if (found) {
      return;
    }

    setErrorMessage("启动文件夹已不存在，已自动清除设置");
    setLayout((prev) => {
      const next = { ...prev, startupFolderId: null };
      void writeLayoutState(next);
      return next;
    });
    if (activeFolderId === startupId) {
      setActiveFolderId(null);
    }
  }, [tree, layout.startupFolderId, activeFolderId]);

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

  const fullPath = useMemo(() => {
    const root = tree[0];
    if (!root || !activeFolderId) {
      return [] as BookmarkNode[];
    }
    return findPathInTree(root, activeFolderId) ?? [];
  }, [tree, activeFolderId]);

  const breadcrumbSegments = useMemo(() => {
    // fullPath[0] 通常是虚拟 root 节点（title: root），不展示。
    const visible = fullPath.length >= 2 ? fullPath.slice(1) : [];
    return visible.map((n) => ({ id: n.id, title: getCardTitle(n) }));
  }, [fullPath]);

  const navigateToFolder = useCallback(
    async (id: string | null) => {
      clearFolderClickTimer();
      setExpandedIds(new Set());
      setActiveFolderId(id);
      setLayout((prev) => {
        const next = { ...prev, lastOpenFolder: id };
        void writeLayoutState(next);
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  useEffect(() => {
    setOrderedIds(currentNodes.map((n) => n.id));
    reorderRequestIdRef.current += 1;
  }, [activeFolderId, tree]);

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
    await navigateToFolder(id);
  };

  const handleBackToParent = async () => {
    if (!activeFolderId) {
      return;
    }
    const root = tree[0];
    if (!root) {
      await navigateToFolder(null);
      return;
    }
    const path = findPathInTree(root, activeFolderId);
    if (!path || path.length < 2) {
      await navigateToFolder(null);
      return;
    }
    // root -> X (top-level folder) 视为回到顶层。
    if (path.length === 2) {
      await navigateToFolder(null);
      return;
    }
    const parent = path[path.length - 2];
    await navigateToFolder(parent.id);
  };

  const openCreateFolderDialog = () => {
    // 根视图默认落到第一个顶层文件夹（通常是“书签栏”），与之前的默认落点保持一致。
    const parentId = (currentFolder ?? rootNodes[0])?.id ?? "0";
    setCreateFolderParentId(parentId);
    setCreateFolderServerError(null);
    setCreateFolderOpen(true);
  };

  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) {
      return [];
    }

    const t = contextMenu.target;
    if (t.kind === "folder") {
      const isStartup = layout.startupFolderId === t.id;
      return [
        {
          key: "startup",
          label: isStartup ? "取消启动文件夹" : "设为启动文件夹",
          onSelect: () => {
            void (async () => {
              const next = {
                ...layoutRef.current,
                startupFolderId: isStartup ? null : t.id,
                lastOpenFolder: isStartup ? layoutRef.current.lastOpenFolder : t.id
              };
              setLayout(next);
              await writeLayoutState(next);
              closeContextMenu();
              if (!isStartup) {
                await navigateToFolder(t.id);
              }
            })();
          }
        },
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
  }, [contextMenu, closeContextMenu, navigateToFolder, layout.startupFolderId]);

  const parentIdForCurrentView = useMemo(() => {
    if (activeFolderId) {
      return activeFolderId;
    }
    return tree[0]?.id ?? "0";
  }, [activeFolderId, tree]);

  // Grid Rendering Logic
  const renderGrid = () => {
    const items: ReactNode[] = [];

    if (activeFolderId) {
      const parentTitle = (() => {
        const path = fullPath;
        if (!path || path.length < 2) {
          return "全部书签";
        }
        if (path.length === 2) {
          return "全部书签";
        }
        const parent = path[path.length - 2];
        return getCardTitle(parent);
      })();

      items.push(
        <BackCard
          key="__back__"
          title={parentTitle}
          subtitle="返回上级"
          onClick={() => {
            void handleBackToParent();
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

    const byId = new Map(currentNodes.map((n) => [n.id, n] as const));
    const orderedNodes: BookmarkNode[] = [];
    const seen = new Set<string>();

    for (const id of orderedIds) {
      const n = byId.get(id);
      if (n) {
        orderedNodes.push(n);
        seen.add(id);
      }
    }
    for (const n of currentNodes) {
      if (!seen.has(n.id)) {
        orderedNodes.push(n);
      }
    }

    items.push(
      <SortableGrid
        key={`__sortable__:${activeFolderId ?? "root"}`}
        ids={orderedNodes.map((n) => n.id)}
        disabled={offline || !parentIdForCurrentView || !editMode}
        disabledIds={expandedIds}
        onReorder={(nextIds) => {
          const prev = orderedIds;
          setOrderedIds(nextIds);
          if (offline) {
            setErrorMessage("离线快照模式下无法写回排序");
            setOrderedIds(prev);
            return;
          }
          if (!parentIdForCurrentView) {
            setErrorMessage("当前视图无法确定父级节点，写回失败");
            setOrderedIds(prev);
            return;
          }

          const requestId = ++reorderRequestIdRef.current;
          void reorderBookmarkChildren({ parentId: parentIdForCurrentView, orderedIds: nextIds }).then((resp) => {
            if (reorderRequestIdRef.current !== requestId) {
              return;
            }
            if (!resp.success) {
              setErrorMessage(resp.error ?? "写回排序失败");
              setOrderedIds(prev);
            }
          });
        }}
        render={({ id, dragHandle, setNodeRef, style, isDragging }) => {
          const node = byId.get(id);
          if (!node) {
            return null;
          }
          const isExpanded = expandedIds.has(node.id);

          // Folders can be empty, so detect by missing URL instead of children length.
          if (!node.url) {
            const childrenNodes = node.children ?? [];
            return (
              <FolderCard
                id={node.id}
                title={getCardTitle(node)}
                count={childrenNodes.length}
                isOpen={isExpanded}
                onToggle={() => handleFolderToggleGesture(node.id, isExpanded)}
                onDoubleClick={() => {
                  clearFolderClickTimer();
                  void handleSubFolderOpen(node.id);
                }}
                childrenNodes={childrenNodes}
                onSubFolderClick={handleSubFolderOpen}
                onContextMenu={openContextMenu}
                dragHandle={dragHandle}
                sortableRef={setNodeRef as unknown as (node: HTMLDivElement | null) => void}
                sortableStyle={style}
                dndDragging={isDragging}
              />
            );
          }

          return (
            <BookmarkCard
              id={node.id}
              title={getCardTitle(node)}
              url={node.url ?? ""}
              disableOpen={editMode}
              onContextMenu={openContextMenu}
              dragHandle={dragHandle}
              sortableRef={setNodeRef as unknown as (node: HTMLDivElement | null) => void}
              sortableStyle={style}
              dndDragging={isDragging}
            />
          );
        }}
      />
    );

    return items;
  };

  return (
    <div className="px-[clamp(20px,5vw,60px)] py-10 max-w-[1600px] mx-auto w-full flex-1">
      <header className="flex items-center justify-between gap-6 mb-10 flex-wrap">
        <div>
          <span className="text-[28px] font-bold tracking-tight block">Yew Tab</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-text font-medium">书签一眼可见</span>
            {import.meta.env.DEV && (
              <span className="text-xs text-muted-text/50 font-mono">{__APP_VERSION__}</span>
            )}
          </div>
        </div>

        <SearchBar />
        <div className="flex gap-3">
          {offline && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              离线快照
            </span>
          )}
          <Button
            variant="secondary"
            className={
              editMode
                ? "h-10 px-3 border border-[rgba(47,128,237,0.28)] bg-[rgba(47,128,237,0.12)] text-[rgba(47,128,237,0.95)]"
                : "h-10 px-3"
            }
            aria-label={editMode ? "退出整理模式" : "进入整理模式"}
            title={editMode ? "退出整理模式 (Alt+E)" : "进入整理模式 (Alt+E)"}
            onClick={() => setEditMode((v) => !v)}
          >
            <IconEdit className="h-5 w-5" />
            <span className="text-sm">整理</span>
          </Button>
          <Button
            variant="secondary"
            className="h-10 w-10 px-0"
            aria-label="打开设置"
            onClick={() => setSettingsOpen(true)}
          >
            <IconSettings className="h-5 w-5" />
          </Button>
          <Button variant="primary" onClick={openCreateFolderDialog}>
            新增文件夹
          </Button>
        </div>
      </header>

      <div className="mb-6">
        <Breadcrumb
          segments={breadcrumbSegments}
          onNavigate={(id) => {
            void navigateToFolder(id);
          }}
        />
      </div>

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

      <CreateFolderDialog
        open={createFolderOpen}
        serverError={createFolderServerError}
        onClose={() => {
          setCreateFolderOpen(false);
          setCreateFolderParentId(null);
          setCreateFolderServerError(null);
        }}
        onSubmit={async (payload) => {
          if (offline) {
            const msg = "离线快照模式下无法创建文件夹";
            setCreateFolderServerError(msg);
            setErrorMessage(msg);
            return false;
          }

          const parentId = createFolderParentId ?? (currentFolder ?? rootNodes[0])?.id ?? "0";
          const action: BookmarkAction = {
            type: "create",
            parentId,
            title: payload.title
          };
          const response = await applyBookmarkChange(action);
          if (!response.success) {
            const msg = response.error ?? "创建文件夹失败";
            setCreateFolderServerError(msg);
            setErrorMessage(msg);
            return false;
          }
          return true;
        }}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
