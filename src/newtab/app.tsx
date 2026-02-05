import { useMemo, useRef, useState } from "react";
import { useBackground } from "@/hooks/use-background";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { useEditMode } from "@/hooks/use-edit-mode";
import { useContextMenu } from "@/hooks/use-context-menu";
import { useGridColumns } from "@/hooks/use-grid-columns";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { useLayoutState } from "@/hooks/use-layout-state";
import { useSortableOrder } from "@/hooks/use-sortable-order";
import { useContextMenuItems } from "./hooks/use-context-menu-items";
import { getTopLevelNodes } from "./utils";
import type { ContextMenuTarget } from "./types";

import AppHeader from "./components/app-header";
import BookmarkGrid from "./components/bookmark-grid";
import DialogsManager from "./components/dialogs-manager";
import Breadcrumb from "./components/breadcrumb";
import ContextMenu from "./components/context-menu";
import SettingsModal from "./settings";

export default function App() {
  useBackground();
  const gridRef = useRef<HTMLDivElement>(null);

  // 核心数据
  const { tree, offline, errorMessage, setErrorMessage } = useBookmarks();
  const { editMode, setEditMode } = useEditMode();
  const { contextMenu, openContextMenu, closeContextMenu } = useContextMenu();
  useGridColumns(gridRef, [tree]);

  // 导航状态
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // 布局状态 - 需要在导航之后初始化
  const { layout, setLayout, layoutRef } = useLayoutState(tree, activeFolderId, setActiveFolderId, setErrorMessage);

  const {
    expandedIds,
    currentFolder,
    currentNodes,
    fullPath,
    breadcrumbSegments,
    navigateToFolder,
    handleFolderToggleGesture,
    handleSubFolderOpen,
    handleBackToParent,
    clearFolderClickTimer
  } = useFolderNavigation(tree, layout, setLayout, activeFolderId, setActiveFolderId);

  // 对话框状态
  const [editTarget, setEditTarget] = useState<ContextMenuTarget | null>(null);
  const [editServerError, setEditServerError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Extract<ContextMenuTarget, { kind: "bookmark" }> | null>(null);
  const [deleteServerError, setDeleteServerError] = useState<string | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);
  const [createFolderServerError, setCreateFolderServerError] = useState<string | null>(null);

  // 计算值
  const rootNodes = useMemo(() => getTopLevelNodes(tree), [tree]);
  const parentIdForCurrentView = useMemo(() => {
    if (activeFolderId) {
      return activeFolderId;
    }
    return tree[0]?.id ?? "0";
  }, [activeFolderId, tree]);

  // 排序逻辑
  const { orderedIds, handleReorder } = useSortableOrder(
    currentNodes,
    activeFolderId,
    parentIdForCurrentView,
    offline,
    setErrorMessage
  );

  // 右键菜单项
  const contextMenuItems = useContextMenuItems({
    contextMenu,
    layout,
    layoutRef,
    setLayout,
    closeContextMenu,
    navigateToFolder,
    setEditTarget,
    setDeleteTarget,
    setEditServerError,
    setDeleteServerError
  });

  const openCreateFolderDialog = () => {
    const parentId = (currentFolder ?? rootNodes[0])?.id ?? "0";
    setCreateFolderParentId(parentId);
    setCreateFolderServerError(null);
    setCreateFolderOpen(true);
  };

  const defaultParentId = (currentFolder ?? rootNodes[0])?.id ?? "0";

  return (
    <div className="px-[clamp(20px,5vw,60px)] py-10 max-w-[1600px] mx-auto w-full flex-1">
      <AppHeader
        offline={offline}
        editMode={editMode}
        onEditModeToggle={() => setEditMode((v) => !v)}
        onSettingsOpen={() => setSettingsOpen(true)}
        onCreateFolder={openCreateFolderDialog}
      />

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
        <BookmarkGrid
          activeFolderId={activeFolderId}
          currentNodes={currentNodes}
          orderedIds={orderedIds}
          expandedIds={expandedIds}
          editMode={editMode}
          offline={offline}
          parentIdForCurrentView={parentIdForCurrentView}
          fullPath={fullPath}
          onReorder={handleReorder}
          onBackToParent={handleBackToParent}
          onFolderToggleGesture={handleFolderToggleGesture}
          onSubFolderOpen={handleSubFolderOpen}
          onContextMenu={openContextMenu}
          clearFolderClickTimer={clearFolderClickTimer}
        />
      </section>

      <ContextMenu
        open={!!contextMenu}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenuItems}
        onClose={closeContextMenu}
      />

      <DialogsManager
        editTarget={editTarget}
        editServerError={editServerError}
        onEditClose={() => {
          setEditTarget(null);
          setEditServerError(null);
        }}
        setErrorMessage={setErrorMessage}
        deleteTarget={deleteTarget}
        deleteServerError={deleteServerError}
        onDeleteClose={() => {
          setDeleteTarget(null);
          setDeleteServerError(null);
        }}
        createFolderOpen={createFolderOpen}
        createFolderParentId={createFolderParentId}
        createFolderServerError={createFolderServerError}
        onCreateFolderClose={() => {
          setCreateFolderOpen(false);
          setCreateFolderParentId(null);
          setCreateFolderServerError(null);
        }}
        offline={offline}
        defaultParentId={defaultParentId}
        setEditServerError={setEditServerError}
        setDeleteServerError={setDeleteServerError}
        setCreateFolderServerError={setCreateFolderServerError}
      />

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
