import { useState, useCallback, useEffect, useRef } from "react";
import type { MouseEvent } from "react";
import type { ContextMenuTarget } from "@/newtab/types";

export type ContextMenuState = {
  x: number;
  y: number;
  target: ContextMenuTarget;
} | null;

export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const suppressReactContextMenuRef = useRef(0);

  const openContextMenu = useCallback((event: MouseEvent, target: ContextMenuTarget) => {
    if (Date.now() - suppressReactContextMenuRef.current < 50) {
      return;
    }
    setContextMenu({ x: event.clientX, y: event.clientY, target });
  }, []);

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

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

      let ctxTarget: ContextMenuTarget | null = null;
      if (kind === "folder") {
        if (!id) return;
        ctxTarget = { kind: "folder", id, title };
      } else if (kind === "bookmark") {
        if (!id) return;
        const url = el.dataset.yewUrl ?? "";
        ctxTarget = { kind: "bookmark", id, title, url };
      } else if (kind === "background") {
        // 背景右键：用于粘贴到当前文件夹
        const currentFolderId = el.dataset.yewCurrentFolderId ?? null;
        ctxTarget = { kind: "background", currentFolderId };
      }
      
      if (!ctxTarget) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      (event as unknown as { stopImmediatePropagation?: () => void }).stopImmediatePropagation?.();
      suppressReactContextMenuRef.current = Date.now();

      setContextMenu({ x: event.clientX, y: event.clientY, target: ctxTarget });
    };

    window.addEventListener("contextmenu", handler, { capture: true });
    return () => window.removeEventListener("contextmenu", handler, { capture: true } as AddEventListenerOptions);
  }, []);

  return { contextMenu, openContextMenu, closeContextMenu };
}
