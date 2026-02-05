import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  error?: string | null;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  error,
  confirmText = "确认",
  cancelText = "取消",
  danger,
  onClose,
  onConfirm
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    cancelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1100] grid place-items-center px-5"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-[4px]"
        onMouseDown={() => {
          if (!pending) {
            onClose();
          }
        }}
      />

      <div
        className={cn(
          "relative w-full max-w-[420px]",
          "rounded-[18px] border border-white/50",
          "bg-glass-strong/95 backdrop-blur-[14px]",
          "shadow-[0_20px_60px_rgba(0,0,0,0.22)]",
          "p-5"
        )}
      >
        <div className="text-[15px] font-bold text-ink">{title}</div>
        {description && <div className="mt-2 text-sm text-muted-text leading-relaxed">{description}</div>}
        {error && <div className="mt-3 rounded-[12px] bg-destructive/10 text-destructive px-3 py-2 text-sm">{error}</div>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            ref={cancelRef}
            type="button"
            className={cn(
              "px-4 py-2 rounded-[12px] font-semibold",
              "bg-black/5 hover:bg-black/10",
              "text-ink",
              "transition-colors",
              pending && "opacity-60 cursor-not-allowed"
            )}
            disabled={pending}
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={cn(
              "px-4 py-2 rounded-[12px] font-semibold",
              danger
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-colors",
              pending && "opacity-60 cursor-not-allowed"
            )}
            disabled={pending}
            onClick={async () => {
              if (pending) {
                return;
              }
              setPending(true);
              try {
                const ok = await onConfirm();
                if (ok) {
                  onClose();
                }
              } finally {
                setPending(false);
              }
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
