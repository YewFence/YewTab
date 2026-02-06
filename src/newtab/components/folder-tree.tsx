import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { BookmarkNode } from "@/shared/types";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { Radio } from "@/components/ui/radio";
import { motion, AnimatePresence } from "framer-motion";

type FolderTreeProps = {
  nodes: BookmarkNode[];
  selectedId: string | null;
  onSelect: (id: string, title: string) => void;
  className?: string;
  defaultExpandedIds?: string[];
  depth?: number;
};

// 递归渲染文件夹树项
const FolderTreeItem = ({
  node,
  selectedId,
  onSelect,
  depth,
  isExpanded,
  onToggle
}: {
  node: BookmarkNode;
  selectedId: string | null;
  onSelect: (id: string, title: string) => void;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  // 过滤出子文件夹
  const childFolders = node.children?.filter(child => !child.url) ?? [];
  const hasChildren = childFolders.length > 0;
  const isSelected = node.id === selectedId;

  // 根目录通常 id 为 '0'，这里我们展示为 "全部书签"
  const displayTitle = node.id === '0' ? "全部书签" : (node.title || "未命名");

  const handleRowClick = () => {
    // 默认点击整行既展开又选中
    onSelect(node.id, displayTitle);
    onToggle();
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 py-2 pr-3 rounded-[10px] cursor-pointer transition-colors duration-200 select-none",
          isSelected
            ? "bg-primary/10 text-primary font-medium"
            : "text-ink hover:bg-glass-strong"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleRowClick}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={cn(
            "w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            size={14}
            className={cn(
              "text-muted-text transition-transform duration-200",
              isExpanded && "rotate-90"
            )}
          />
        </button>

        <div className={cn(
          "shrink-0",
          isSelected ? "text-primary" : "text-muted-text group-hover:text-ink/70"
        )}>
          {isExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
        </div>

        <div className="flex-1 truncate text-sm">
          {displayTitle}
        </div>

        <Radio
          checked={isSelected}
          onChange={() => {}} // 由外层 div 处理点击
          onClick={(e) => {
             e.stopPropagation();
             onSelect(node.id, displayTitle);
          }}
          tabIndex={-1}
          className=""
        />
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {childFolders.map(child => (
              <FolderTreeNode
                key={child.id}
                node={child}
                selectedId={selectedId}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 带有自身状态管理的节点组件
const FolderTreeNode = (props: Omit<Parameters<typeof FolderTreeItem>[0], "isExpanded" | "onToggle">) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <FolderTreeItem
      {...props}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(prev => !prev)}
    />
  );
};


export default function FolderTree({
  nodes,
  selectedId,
  onSelect,
  className,
}: FolderTreeProps) {
  // 只渲染文件夹（顶级通常也是文件夹或含有文件夹的根）
  // 注意：根节点通常没有 ID 或特殊，视具体数据结构而定。
  // chrome.bookmarks.getTree() 返回的数组通常包含一个根节点（id="0"），下面有 "书签栏" (id="1") 等。
  // 我们直接遍历传入的 nodes。

  return (
    <div className={cn("flex flex-col select-none", className)}>
      {nodes.map(node => {
        // 如果节点本身是 url 节点，则跳过（理论上传入前已过滤，但再做一次防护）
        if (node.url) return null;
        
        return (
          <FolderTreeNode
            key={node.id}
            node={node}
            selectedId={selectedId}
            onSelect={onSelect}
            depth={0}
          />
        );
      })}
    </div>
  );
}
