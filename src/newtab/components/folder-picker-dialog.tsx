import { createPortal } from "react-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import FolderTree from "./folder-tree";
import { Button } from "@/components/ui/button";
import type { BookmarkNode } from "@/shared/types";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const pendingRef = useRef(false);

  // 当弹窗打开时，重置状态
  useEffect(() => {
    if (open) {
      setSelectedId(initialSelectedId ?? null);
      // 如果有 tree 且有 initialSelectedId，尝试查找对应的 title (可选优化)
    }
  }, [open, initialSelectedId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

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

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[1100] grid place-items-center px-5" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/20 backdrop-blur-[4px]"
            onMouseDown={onClose}
          />

          {/* Dialog Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full max-w-[500px] flex flex-col",
              "rounded-[18px] border border-border-glass",
              "bg-glass-strong/95 backdrop-blur-[14px]",
              "shadow-[0_20px_60px_rgba(0,0,0,0.22)]",
              "max-h-[80vh]"
            )}
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
