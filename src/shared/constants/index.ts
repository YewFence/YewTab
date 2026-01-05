// 定义扩展内通信与存储键常量。
export const MESSAGE_TYPES = {
  LOAD_BOOKMARKS: "load_bookmarks",
  APPLY_BOOKMARK_CHANGE: "apply_bookmark_change",
  BOOKMARKS_CHANGED: "bookmarks_changed"
} as const;

export const STORAGE_KEYS = {
  SNAPSHOT: "bookmarks_snapshot",
  LAYOUT: "layout_state"
} as const;

export const SNAPSHOT_VERSION = 1;
