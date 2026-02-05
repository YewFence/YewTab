import { useMemo } from "react";
import type { ContextMenuTarget } from "@/newtab/types";
import type { ContextMenuItem } from "@/newtab/components/context-menu";
import type { LayoutState } from "@/shared/types";
import { writeLayoutState } from "@/lib/storage";

type UseContextMenuItemsParams = {
  contextMenu: { target: ContextMenuTarget } | null;
  layout: LayoutState;
  layoutRef: React.RefObject<LayoutState>;
  setLayout: React.Dispatch<React.SetStateAction<LayoutState>>;
  closeContextMenu: () => void;
  navigateToFolder: (id: string | null) => Promise<void>;
  setEditTarget: (target: ContextMenuTarget | null) => void;
  setDeleteTarget: (target: Extract<ContextMenuTarget, { kind: "bookmark" }> | null) => void;
  setEditServerError: (err: string | null) => void;
  setDeleteServerError: (err: string | null) => void;
};

export function useContextMenuItems({
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
}: UseContextMenuItemsParams): ContextMenuItem[] {
  return useMemo(() => {
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
  }, [
    contextMenu,
    closeContextMenu,
    navigateToFolder,
    layout.startupFolderId,
    layoutRef,
    setLayout,
    setEditTarget,
    setDeleteTarget,
    setEditServerError,
    setDeleteServerError
  ]);
}
