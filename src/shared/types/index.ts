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
  // 打开新标签页时始终跳转到该文件夹（为 null 时不启用）
  startupFolderId: string | null;
  // 文件夹展开状态持久化
  keepFolderExpansion?: boolean;
  expandedFolderIds?: string[];
  // 打开方式：是否在新标签页打开（默认 false）
  openInNewTab?: boolean;
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

// 背景设置相关类型
export type BackgroundType = "gradient" | "image";
export type ImageSource = "upload" | "url";
export type ImagePosition = "cover" | "contain" | "center" | "tile";

export type ThemeBackground = {
  type: BackgroundType;
  imageSource?: ImageSource;
  imageData?: string;  // Base64 或 URL
  imagePosition?: ImagePosition;
  overlayOpacity?: number;  // 0-100，叠加层透明度
};

export type BackgroundSettings = {
  light: ThemeBackground;
  dark: ThemeBackground;
};

// 备份相关类型
export type ThemeBackgroundBackup = Omit<ThemeBackground, "imageData"> & {
  imageData?: string;      // Base64 或 URL
  imageEmbedded?: boolean; // 标记图片是否已嵌入为 Base64
};

export type BackgroundSettingsBackup = {
  light: ThemeBackgroundBackup;
  dark: ThemeBackgroundBackup;
};

export type YewTabBackup = {
  version: number;              // 备份格式版本号
  exportedAt: string;           // ISO 时间戳
  appVersion: string;           // 应用版本
  data: {
    bookmarks: BookmarkNode[];
    layoutState: LayoutState;
    searchSettings: SearchSettings;
    backgroundSettings: BackgroundSettingsBackup;
  };
};

export type ImportHtmlOptions = {
  targetFolderId: string;  // 导入到哪个文件夹
  merge?: boolean;         // 是否合并（默认 true）
};

export type ImportHtmlResult = {
  success: boolean;
  importedCount: number;
  folderCount: number;
  errors: string[];
};

export type ImportJsonOptions = {
  importBookmarks?: boolean;
  importSettings?: boolean;
  targetFolderId?: string;
};

export type ImportJsonResult = {
  success: boolean;
  bookmarksImported: number;
  foldersImported: number;
  settingsRestored: boolean;
  errors: string[];
  warnings: string[];
};

export type ExportHtmlOptions = {
  rootId?: string;  // 可选的根目录 ID，为空则导出全部
};
