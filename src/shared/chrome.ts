// 在开发环境提供 Chromium API shim，避免非扩展上下文报错。
import { MESSAGE_TYPES, SNAPSHOT_VERSION, STORAGE_KEYS } from "./constants";
import type {
  ApplyBookmarkChangeResponse,
  BookmarkAction,
  BookmarkNode,
  BookmarkSnapshot,
  LayoutState,
  LoadBookmarksResponse
} from "./types";

type ChromeApi = typeof chrome;

const isDev = import.meta.env.DEV;
const hasChrome = typeof chrome !== "undefined" && !!chrome.runtime;
const useMock = !hasChrome;

const createMockTree = (): BookmarkNode[] => [
  {
    id: "0",
    title: "root",
    children: [
      {
        id: "1",
        title: "示例文件夹",
        children: [
          {
            id: "2",
            title: "Yew Tab",
            url: "https://www.example.com"
          }
        ]
      }
    ]
  }
];

const mockLayoutState: LayoutState = {
  pinnedIds: [],
  lastOpenFolder: null
};

const runtimeListeners = new Set<
  (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => void | boolean
>();
const bookmarkListeners = {
  created: new Set<() => void>(),
  removed: new Set<() => void>(),
  changed: new Set<() => void>(),
  moved: new Set<() => void>()
};

const storageData = new Map<string, unknown>();
let mockTree = createMockTree();
let mockUpdatedAt = new Date().toISOString();
let nextId = 100;

const updateSnapshot = () => {
  mockUpdatedAt = new Date().toISOString();
  const snapshot: BookmarkSnapshot = {
    version: SNAPSHOT_VERSION,
    updatedAt: mockUpdatedAt,
    tree: mockTree
  };
  storageData.set(STORAGE_KEYS.SNAPSHOT, snapshot);
};

const emitRuntimeMessage = (message: unknown) => {
  for (const listener of runtimeListeners) {
    listener(message, {}, () => undefined);
  }
};

const emitBookmarkChange = () => {
  bookmarkListeners.created.forEach((listener) => listener());
  bookmarkListeners.removed.forEach((listener) => listener());
  bookmarkListeners.changed.forEach((listener) => listener());
  bookmarkListeners.moved.forEach((listener) => listener());
};

const findNodeById = (nodes: BookmarkNode[], id: string): BookmarkNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    if (node.children?.length) {
      const found = findNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }
  return null;
};

const applyMockAction = (action: BookmarkAction): string | undefined => {
  switch (action.type) {
    case "create": {
      const parent = findNodeById(mockTree, action.parentId);
      if (!parent) {
        return;
      }
      const createdId = String(nextId++);
      const nextNode: BookmarkNode = {
        id: createdId,
        title: action.title,
        url: action.url
      };
      if (!parent.children) {
        parent.children = [];
      }
      const insertIndex = action.index ?? parent.children.length;
      parent.children.splice(insertIndex, 0, nextNode);
      return createdId;
    }
    case "update": {
      const target = findNodeById(mockTree, action.id);
      if (!target) {
        return;
      }
      if (typeof action.title !== "undefined") {
        target.title = action.title;
      }
      if (typeof action.url !== "undefined") {
        target.url = action.url;
      }
      return;
    }
    case "move": {
      const target = findNodeById(mockTree, action.id);
      const destination = findNodeById(mockTree, action.parentId);
      if (!target || !destination) {
        return;
      }
      const detach = (nodes: BookmarkNode[]): boolean => {
        const index = nodes.findIndex((node) => node.id === action.id);
        if (index >= 0) {
          nodes.splice(index, 1);
          return true;
        }
        for (const node of nodes) {
          if (node.children && detach(node.children)) {
            return true;
          }
        }
        return false;
      };
      detach(mockTree);
      if (!destination.children) {
        destination.children = [];
      }
      destination.children.push(target);
      return;
    }
    case "remove": {
      const removeFrom = (nodes: BookmarkNode[]): boolean => {
        const index = nodes.findIndex((node) => node.id === action.id);
        if (index >= 0) {
          nodes.splice(index, 1);
          return true;
        }
        for (const node of nodes) {
          if (node.children && removeFrom(node.children)) {
            return true;
          }
        }
        return false;
      };
      removeFrom(mockTree);
      return;
    }
    default:
      return;
  }
};

const mockChrome = {
  runtime: {
    id: "dev-runtime",
    onMessage: {
      addListener: (listener: (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => void | boolean) => {
        runtimeListeners.add(listener);
      },
      removeListener: (listener: (message: unknown, sender: chrome.runtime.MessageSender, sendResponse: (response: unknown) => void) => void | boolean) => {
        runtimeListeners.delete(listener);
      }
    },
    onInstalled: {
      addListener: (_listener: () => void) => undefined,
      removeListener: (_listener: () => void) => undefined
    },
    sendMessage: async (message: { type?: string; payload?: BookmarkAction }): Promise<LoadBookmarksResponse | ApplyBookmarkChangeResponse> => {
      if (message?.type === MESSAGE_TYPES.LOAD_BOOKMARKS) {
        return {
          tree: mockTree,
          updatedAt: mockUpdatedAt,
          fromCache: false
        };
      }
      if (message?.type === MESSAGE_TYPES.APPLY_BOOKMARK_CHANGE && message.payload) {
        applyMockAction(message.payload);
        updateSnapshot();
        emitBookmarkChange();
        emitRuntimeMessage({ type: MESSAGE_TYPES.BOOKMARKS_CHANGED });
        return { success: true };
      }
      return { success: false, error: "未知的 mock 消息" };
    },
    reload: () => {
      console.info("[yew-tab] dev runtime reload");
    }
  },
  bookmarks: {
    getTree: async () => mockTree,
    create: async (details: chrome.bookmarks.BookmarkCreateArg) => {
      const createdId = applyMockAction({
        type: "create",
        parentId: details.parentId ?? "0",
        title: details.title ?? "未命名书签",
        url: details.url,
        index: details.index
      });
      updateSnapshot();
      emitBookmarkChange();
      return {
        id: createdId ?? String(nextId++),
        title: details.title ?? "未命名书签",
        url: details.url,
        parentId: details.parentId ?? "0"
      };
    },
    move: async (id: string, moveInfo: chrome.bookmarks.BookmarkMoveArg) => {
      applyMockAction({
        type: "move",
        id,
        parentId: moveInfo.parentId,
        index: moveInfo.index
      });
      updateSnapshot();
      emitBookmarkChange();
      return { id, parentId: moveInfo.parentId };
    },
    remove: async (id: string) => {
      applyMockAction({ type: "remove", id });
      updateSnapshot();
      emitBookmarkChange();
    },
    removeTree: async (id: string) => {
      applyMockAction({ type: "remove", id, recursive: true });
      updateSnapshot();
      emitBookmarkChange();
    },
    update: async (id: string, changes: chrome.bookmarks.BookmarkChangesArg) => {
      applyMockAction({
        type: "update",
        id,
        title: changes.title,
        url: changes.url
      });
      updateSnapshot();
      emitBookmarkChange();
      return { id, title: changes.title, url: changes.url };
    },
    onCreated: {
      addListener: (listener: () => void) => bookmarkListeners.created.add(listener),
      removeListener: (listener: () => void) => bookmarkListeners.created.delete(listener)
    },
    onRemoved: {
      addListener: (listener: () => void) => bookmarkListeners.removed.add(listener),
      removeListener: (listener: () => void) => bookmarkListeners.removed.delete(listener)
    },
    onChanged: {
      addListener: (listener: () => void) => bookmarkListeners.changed.add(listener),
      removeListener: (listener: () => void) => bookmarkListeners.changed.delete(listener)
    },
    onMoved: {
      addListener: (listener: () => void) => bookmarkListeners.moved.add(listener),
      removeListener: (listener: () => void) => bookmarkListeners.moved.delete(listener)
    }
  },
  storage: {
    local: {
      get: async (keys: string | string[] | Record<string, unknown>) => {
        if (typeof keys === "string") {
          return { [keys]: storageData.get(keys) };
        }
        if (Array.isArray(keys)) {
          return keys.reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = storageData.get(key);
            return acc;
          }, {});
        }
        if (keys && typeof keys === "object") {
          return Object.keys(keys).reduce<Record<string, unknown>>((acc, key) => {
            acc[key] = storageData.has(key) ? storageData.get(key) : (keys as Record<string, unknown>)[key];
            return acc;
          }, {});
        }
        return {};
      },
      set: async (items: Record<string, unknown>) => {
        Object.entries(items).forEach(([key, value]) => {
          storageData.set(key, value);
          if (key === STORAGE_KEYS.SNAPSHOT) {
            const snapshot = value as BookmarkSnapshot | undefined;
            if (snapshot?.tree) {
              mockTree = snapshot.tree;
              mockUpdatedAt = snapshot.updatedAt;
            }
          }
        });
      }
    }
  }
};

if (useMock) {
  storageData.set(STORAGE_KEYS.LAYOUT, mockLayoutState);
  updateSnapshot();
}

export const chromeApi: ChromeApi = (useMock ? (mockChrome as ChromeApi) : chrome);
