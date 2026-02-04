// 定义新标签页与后台通信的核心数据结构。
export type BookmarkNode = chrome.bookmarks.BookmarkTreeNode;

export type BookmarkAction =
  | {
      type: "create";
      parentId: string;
      title: string;
      url?: string;
      index?: number;
    }
  | {
      type: "move";
      id: string;
      parentId: string;
      index?: number;
    }
  | {
      type: "remove";
      id: string;
      recursive?: boolean;
    }
  | {
      type: "update";
      id: string;
      title?: string;
      url?: string;
    };

export type BookmarkSnapshot = {
  version: number;
  updatedAt: string;
  tree: BookmarkNode[];
};

export type LayoutState = {
  pinnedIds: string[];
  lastOpenFolder: string | null;
};

export type LoadBookmarksResponse = {
  tree: BookmarkNode[];
  updatedAt: string;
  fromCache: boolean;
  error?: string;
};

export type ApplyBookmarkChangeResponse = {
  success: boolean;
  error?: string;
};

export type ReorderBookmarkChildrenPayload = {
  parentId: string;
  orderedIds: string[];
};

export type SearchEngine = "bing" | "google" | "duckduckgo";

export type SearchSettings = {
  defaultEngine: SearchEngine;
};
