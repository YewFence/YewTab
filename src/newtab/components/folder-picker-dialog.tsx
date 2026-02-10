import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import FolderTree from "./folder-tree";
import { Button } from "@/components/ui/button";
import type { BookmarkNode } from "@/shared/types";
import { X } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";

type FolderPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (folderId: string, folderTitle: string) => void;
  tree: BookmarkNode[];
  initialSelectedId?: string | null;
  title?: string;
};

export default function FolderPickerDialog({
  open,
  onClose,
  onConfirm,
  tree,
  initialSelectedId,
  title = "选择文件夹"
}: FolderPickerDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  // 当弹窗打开时，重置状态
  useEffect(() => {
    if (open) {
      setSelectedId(initialSelectedId ?? null);
    }
  }, [open, initialSelectedId]);

  const handleSelect = (id: string, nodeTitle: string) => {
    setSelectedId(id);
    setSelectedTitle(nodeTitle);
  };

  const handleConfirm = () => {
    if (selectedId) {
      onConfirm(selectedId, selectedTitle);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="500px"
      className="flex flex-col max-h-[80vh] p-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-border-glass/50 shrink-0">
        <div className="text-[15px] font-bold text-ink">{title}</div>
        <button
          type="button"
          className={cn(
            "h-8 w-8 rounded-[10px] grid place-items-center",
            "hover:bg-black/5 text-muted-text hover:text-ink",
            "transition-colors"
          )}
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={18} />
        </button>
      </div>

      {/* Scrollable Tree Area */}
      <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
        <FolderTree
          nodes={tree}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      {/* Footer */}
      <div className="p-5 pt-3 flex justify-end gap-2 border-t border-border-glass/50 shrink-0">
        <Button
          variant="ghost"
          onClick={onClose}
          className="rounded-[12px]"
        >
          取消
        </Button>
        <Button
          variant="primary"
          disabled={!selectedId}
          onClick={handleConfirm}
          className="rounded-[12px]"
        >
          确认
        </Button>
      </div>
    </Dialog>
  );
}
