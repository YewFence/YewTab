import type { ContextMenuTarget } from "@/newtab/types";
import type { BookmarkAction } from "@/shared/types";
import { applyBookmarkChange } from "@/lib/messaging";
import EditBookmarkDialog from "./edit-bookmark-dialog";
import ConfirmDialog from "./confirm-dialog";
import CreateFolderDialog from "./create-folder-dialog";

type DialogsManagerProps = {
  editTarget: ContextMenuTarget | null;
  editServerError: string | null;
  onEditClose: () => void;
  setErrorMessage: (msg: string | null) => void;

  deleteTarget: Extract<ContextMenuTarget, { kind: "bookmark" }> | null;
  deleteServerError: string | null;
  onDeleteClose: () => void;

  createFolderOpen: boolean;
  createFolderParentId: string | null;
  createFolderServerError: string | null;
  onCreateFolderClose: () => void;
  offline: boolean;
  defaultParentId: string;

  setEditServerError: (err: string | null) => void;
  setDeleteServerError: (err: string | null) => void;
  setCreateFolderServerError: (err: string | null) => void;
};

export default function DialogsManager({
  editTarget,
  editServerError,
  onEditClose,
  setErrorMessage,
  deleteTarget,
  deleteServerError,
  onDeleteClose,
  createFolderOpen,
  createFolderParentId,
  createFolderServerError,
  onCreateFolderClose,
  offline,
  defaultParentId,
  setEditServerError,
  setDeleteServerError,
  setCreateFolderServerError
}: DialogsManagerProps) {
  const handleEditSubmit = async (payload: { title: string; url?: string }) => {
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
  };

  const handleDeleteConfirm = async () => {
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
  };

  const handleCreateFolderSubmit = async (payload: { title: string }) => {
    if (offline) {
      const msg = "离线快照模式下无法创建文件夹";
      setCreateFolderServerError(msg);
      setErrorMessage(msg);
      return false;
    }

    const parentId = createFolderParentId ?? defaultParentId;
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
  };

  return (
    <>
      <EditBookmarkDialog
        open={!!editTarget}
        target={editTarget}
        serverError={editServerError}
        onClose={onEditClose}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="删除书签？"
        description={deleteTarget ? `即将删除"${deleteTarget.title || "未命名"}"。此操作无法撤销。` : undefined}
        error={deleteServerError}
        confirmText="删除"
        danger
        onClose={onDeleteClose}
        onConfirm={handleDeleteConfirm}
      />

      <CreateFolderDialog
        open={createFolderOpen}
        serverError={createFolderServerError}
        onClose={onCreateFolderClose}
        onSubmit={handleCreateFolderSubmit}
      />
    </>
  );
}
