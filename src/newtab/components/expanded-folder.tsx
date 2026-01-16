import { motion, AnimatePresence } from "framer-motion";
import { BookmarkNode } from "../../shared/types";
import BookmarkCard from "./bookmark-card";
import FolderCard from "./folder-card";

type ExpandedFolderProps = {
  isOpen: boolean;
  childrenNodes: BookmarkNode[];
  onClose: () => void;
  onOpenSubFolder: (id: string) => void;
};

export default function ExpandedFolder({ isOpen, childrenNodes, onClose, onOpenSubFolder }: ExpandedFolderProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="expanded-row-break"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          style={{ overflow: "hidden" }}
        >
          <div className="expanded-container">
            {/* Close Button as the first item */}
            <div className="card-wrapper">
              <button className="card card--close" onClick={onClose} type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Folder Contents */}
            {childrenNodes.map((node) =>
              node.children?.length ? (
                <FolderCard
                  key={node.id}
                  title={node.title}
                  count={node.children.length}
                  isOpen={false} // Sub-folders inside expanded view? Let's just allow clicking to maybe navigate or do nothing for now.
                  onOpen={() => onOpenSubFolder(node.id)}
                />
              ) : (
                <BookmarkCard
                  key={node.id}
                  title={node.title}
                  url={node.url ?? ""}
                />
              )
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
