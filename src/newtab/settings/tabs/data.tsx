import { useEffect, useRef, useState } from "react";
import type { BookmarkNode } from "@/shared/types";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { readBookmarkSnapshot } from "@/lib/storage";
import ExportSection from "@/newtab/settings/components/export-section";
import ImportSection from "@/newtab/settings/components/import-section";
import ResetSection from "@/newtab/settings/components/reset-section";

export default function DataTab() {
  const [bookmarks, setBookmarks] = useState<BookmarkNode[]>([]);
  const initializedRef = useRef(false);
  const { tree } = useBookmarks();

  // 加载书签快照
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    void (async () => {
      const snapshot = await readBookmarkSnapshot();
      if (snapshot?.tree) {
        setBookmarks(snapshot.tree);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <ExportSection bookmarks={bookmarks} tree={tree} />
      <ImportSection tree={tree} />
      <ResetSection />
    </div>
  );
}
