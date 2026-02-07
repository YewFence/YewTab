import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Command, CornerDownLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BookmarkNode } from "@/shared/types";
import { getFaviconUrl } from "../utils";
import { Input } from "@/components/ui/input";

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
  tree: BookmarkNode[];
  onNavigate: (folderId: string) => void;
};

type SearchResult = {
  node: BookmarkNode;
  path: BookmarkNode[];
  matchType: "title" | "url";
};

// 扁平化书签树，生成可搜索的索引
const flattenTree = (
  nodes: BookmarkNode[],
  currentPath: BookmarkNode[] = []
): { node: BookmarkNode; path: BookmarkNode[] }[] => {
  let result: { node: BookmarkNode; path: BookmarkNode[] }[] = [];

  for (const node of nodes) {
    // 记录路径（不包含根节点，通常根节点是不可见的或只是容器）
    const newPath = [...currentPath, node];
    
    // 如果是书签（有 URL），加入结果
    if (node.url) {
      result.push({ node, path: currentPath });
    }
    
    // 如果有子节点，递归
    if (node.children && node.children.length > 0) {
      result = [...result, ...flattenTree(node.children, newPath)];
    }
  }

  return result;
};

export default function SearchModal({ open, onClose, tree, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 初始化索引
  const searchIndex = useMemo(() => {
    // 忽略顶层根节点，直接处理其子节点（通常是"书签栏"、"其他书签"等）
    return flattenTree(tree);
  }, [tree]);

  // 搜索逻辑
  const results = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const matches: SearchResult[] = [];

    for (const item of searchIndex) {
      const titleMatch = item.node.title?.toLowerCase().includes(lowerQuery);
      const urlMatch = item.node.url?.toLowerCase().includes(lowerQuery);

      if (titleMatch || urlMatch) {
        matches.push({
          node: item.node,
          path: item.path,
          matchType: titleMatch ? "title" : "url"
        });
      }

      // 限制结果数量，避免渲染过多卡顿
      if (matches.length >= 50) break;
    }

    return matches;
  }, [query, searchIndex]);

  // 重置选中项
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // 自动聚焦
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [open]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, onClose]);

  // 滚动跟随
  useEffect(() => {
    if (listRef.current && results.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex, results]);

  const handleSelect = (result: SearchResult) => {
    if (result.node.url) {
      // 如果是书签，直接打开
      window.location.href = result.node.url;
      onClose();
    } else {
      // 如果是文件夹（虽然当前逻辑只索引了书签），跳转到文件夹
      // 这里预留给未来可能搜索文件夹的功能
      onNavigate(result.node.id);
      onClose();
    }
  };

  // 高亮匹配文字
  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} className="text-primary font-semibold bg-primary/10 rounded-[2px] px-0.5">{part}</span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "relative w-full max-w-2xl bg-glass-strong backdrop-blur-2xl",
              "rounded-xl shadow-2xl border border-white/20 overflow-hidden",
              "flex flex-col max-h-[70vh]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Input */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10">
              <Search className="w-5 h-5 text-muted-text" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索书签..."
                className="flex-1 bg-transparent border-none outline-none text-lg text-ink placeholder:text-muted-text/70"
                autoComplete="off"
              />
              <div className="flex items-center gap-1.5">
                <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-white/20 bg-white/5 px-2 font-mono text-[10px] font-medium text-muted-text">
                  <span className="text-xs">Esc</span>
                </kbd>
              </div>
            </div>

            {/* Results List */}
            <div 
              ref={listRef}
              className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              {results.length === 0 && query.trim() && (
                <div className="py-12 text-center text-muted-text">
                  <p>没有找到相关书签</p>
                </div>
              )}
              
              {results.length === 0 && !query.trim() && (
                <div className="py-12 text-center text-muted-text/60">
                  <Command className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>输入关键词开始搜索</p>
                </div>
              )}

              {results.map((result, index) => {
                const isSelected = index === selectedIndex;
                const pathString = result.path
                  .filter(p => p.id !== "0") // 过滤掉根节点
                  .map(p => p.title)
                  .join(" / ");

                return (
                  <div
                    key={`${result.node.id}-${index}`}
                    onClick={() => handleSelect(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      "group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      isSelected ? "bg-primary/10" : "hover:bg-white/5"
                    )}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-md bg-white/10 p-1 flex items-center justify-center overflow-hidden">
                      {result.node.url ? (
                        <img 
                          src={getFaviconUrl(result.node.url)} 
                          alt="" 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-sm bg-amber-400/80" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className={cn(
                        "text-sm font-medium truncate mb-0.5",
                        isSelected ? "text-primary" : "text-ink"
                      )}>
                        {highlightText(result.node.title, query)}
                      </div>
                      <div className="flex items-center text-xs text-muted-text truncate gap-2">
                        {pathString && (
                          <span className="flex-shrink-0 opacity-70">
                            {pathString}
                          </span>
                        )}
                        {result.node.url && (
                          <>
                            {pathString && <span className="opacity-40">•</span>}
                            <span className="truncate opacity-50 font-mono">
                              {highlightText(result.node.url, query)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Hint */}
                    {isSelected && (
                      <div className="hidden sm:flex items-center text-muted-text/50">
                        <CornerDownLeft className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/10 bg-white/5 flex items-center justify-between text-[10px] text-muted-text">
              <div className="flex gap-3">
                <span><kbd className="font-sans">↑↓</kbd> 选择</span>
                <span><kbd className="font-sans">↵</kbd> 打开</span>
              </div>
              <div>
                共找到 {results.length} 个结果
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
