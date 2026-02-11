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
        title: "书签栏",
        children: [
          {
            id: "2",
            title: "GitHub",
            url: "https://github.com"
          },
          {
            id: "3",
            title: "Stack Overflow",
            url: "https://stackoverflow.com"
          },
          {
            id: "4",
            title: "前端开发",
            children: [
              {
                id: "5",
                title: "React 官方文档",
                url: "https://react.dev"
              },
              {
                id: "6",
                title: "Tailwind CSS",
                url: "https://tailwindcss.com"
              },
              {
                id: "7",
                title: "MDN Web Docs",
                url: "https://developer.mozilla.org"
              },
              {
                id: "8",
                title: "TypeScript 文档",
                url: "https://www.typescriptlang.org/docs"
              },
              {
                id: "9",
                title: "UI 组件库",
                children: [
                  {
                    id: "10",
                    title: "shadcn/ui",
                    url: "https://ui.shadcn.com"
                  },
                  {
                    id: "11",
                    title: "Radix UI",
                    url: "https://www.radix-ui.com"
                  },
                  {
                    id: "12",
                    title: "Headless UI",
                    url: "https://headlessui.com"
                  }
                ]
              },
              {
                id: "13",
                title: "构建工具",
                children: [
                  {
                    id: "14",
                    title: "Vite",
                    url: "https://vitejs.dev"
                  },
                  {
                    id: "15",
                    title: "Webpack",
                    url: "https://webpack.js.org"
                  },
                  {
                    id: "16",
                    title: "Rollup",
                    url: "https://rollupjs.org"
                  }
                ]
              }
            ]
          },
          {
            id: "17",
            title: "AI 工具",
            children: [
              {
                id: "18",
                title: "ChatGPT",
                url: "https://chat.openai.com"
              },
              {
                id: "19",
                title: "Claude",
                url: "https://claude.ai"
              },
              {
                id: "20",
                title: "Gemini",
                url: "https://gemini.google.com"
              },
              {
                id: "21",
                title: "Perplexity",
                url: "https://www.perplexity.ai"
              }
            ]
          },
          {
            id: "22",
            title: "设计资源",
            children: [
              {
                id: "23",
                title: "Figma",
                url: "https://www.figma.com"
              },
              {
                id: "24",
                title: "Dribbble",
                url: "https://dribbble.com"
              },
              {
                id: "25",
                title: "Behance",
                url: "https://www.behance.net"
              },
              {
                id: "26",
                title: "Unsplash",
                url: "https://unsplash.com"
              },
              {
                id: "27",
                title: "Pexels",
                url: "https://www.pexels.com"
              }
            ]
          },
          {
            id: "28",
            title: "开发文档",
            children: [
              {
                id: "29",
                title: "MDN Web Docs",
                url: "https://developer.mozilla.org"
              },
              {
                id: "30",
                title: "Node.js 文档",
                url: "https://nodejs.org/docs"
              },
              {
                id: "31",
                title: "框架文档",
                children: [
                  {
                    id: "32",
                    title: "React 文档",
                    url: "https://react.dev"
                  },
                  {
                    id: "33",
                    title: "Vue 文档",
                    url: "https://vuejs.org"
                  },
                  {
                    id: "34",
                    title: "Angular 文档",
                    url: "https://angular.io"
                  },
                  {
                    id: "35",
                    title: "Svelte 文档",
                    url: "https://svelte.dev"
                  }
                ]
              }
            ]
          },
          {
            id: "36",
            title: "技术社区",
            children: [
              {
                id: "37",
                title: "Stack Overflow",
                url: "https://stackoverflow.com"
              },
              {
                id: "38",
                title: "GitHub Discussions",
                url: "https://github.com/discussions"
              },
              {
                id: "39",
                title: "Dev.to",
                url: "https://dev.to"
              },
              {
                id: "40",
                title: "Hacker News",
                url: "https://news.ycombinator.com"
              },
              {
                id: "41",
                title: "Reddit - r/programming",
                url: "https://www.reddit.com/r/programming"
              }
            ]
          },
          {
            id: "42",
            title: "工具箱",
            children: [
              {
                id: "43",
                title: "Regex101 - 正则表达式测试",
                url: "https://regex101.com"
              },
              {
                id: "44",
                title: "Can I Use",
                url: "https://caniuse.com"
              },
              {
                id: "45",
                title: "JSON Formatter",
                url: "https://jsonformatter.org"
              },
              {
                id: "46",
                title: "Base64 Encode/Decode",
                url: "https://www.base64encode.org"
              },
              {
                id: "47",
                title: "Color Picker",
                url: "https://htmlcolorcodes.com/color-picker"
              }
            ]
          },
          {
            id: "48",
            title: "生产力工具",
            children: [
              {
                id: "49",
                title: "Notion",
                url: "https://www.notion.so"
              },
              {
                id: "50",
                title: "Trello",
                url: "https://trello.com"
              },
              {
                id: "51",
                title: "Todoist",
                url: "https://todoist.com"
              },
              {
                id: "52",
                title: "Obsidian",
                url: "https://obsidian.md"
              }
            ]
          },
          {
            id: "53",
            title: "新闻资讯",
            children: [
              {
                id: "54",
                title: "Hacker News",
                url: "https://news.ycombinator.com"
              },
              {
                id: "55",
                title: "TechCrunch",
                url: "https://techcrunch.com"
              },
              {
                id: "56",
                title: "The Verge",
                url: "https://www.theverge.com"
              },
              {
                id: "57",
                title: "Ars Technica",
                url: "https://arstechnica.com"
              }
            ]
          }
        ]
      }
    ]
  }
];

const mockLayoutState: LayoutState = {
  pinnedIds: ["2", "3"], // 固定 GitHub 和 Stack Overflow
  lastOpenFolder: null,
  startupFolderId: null,
  expandedStateTree: {
    "__root__": ["4"]  // 在根目录下展开"前端开发"文件夹
  },
  expandedStateVersion: 2,
  openInNewTab: true
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
        url: action.url,
        parentId: action.parentId
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
      target.parentId = action.parentId;
      const insertIndex = typeof action.index === "number" ? action.index : destination.children.length;
      const clampedIndex = Math.max(0, Math.min(insertIndex, destination.children.length));
      destination.children.splice(clampedIndex, 0, target);
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

const isFolderNode = (node: BookmarkNode | null): boolean => {
  // Chrome 书签：文件夹节点没有 url。
  return !!node && !node.url;
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
    sendMessage: async (message: { type?: string; payload?: unknown }): Promise<LoadBookmarksResponse | ApplyBookmarkChangeResponse> => {
      if (message?.type === MESSAGE_TYPES.LOAD_BOOKMARKS) {
        return {
          tree: mockTree,
          updatedAt: mockUpdatedAt,
          fromCache: false
        };
      }
      if (message?.type === MESSAGE_TYPES.APPLY_BOOKMARK_CHANGE && message.payload) {
        const action = message.payload as BookmarkAction;
        if (action.type === "remove") {
          const target = findNodeById(mockTree, action.id);
          if (isFolderNode(target)) {
            return { success: false, error: "当前版本不支持删除文件夹" };
          }
        }
        applyMockAction(action);
        updateSnapshot();
        emitBookmarkChange();
        emitRuntimeMessage({ type: MESSAGE_TYPES.BOOKMARKS_CHANGED });
        return { success: true };
      }
      if (message?.type === MESSAGE_TYPES.REORDER_BOOKMARK_CHILDREN) {
        const payload = message.payload as unknown as { parentId?: string; orderedIds?: string[] };
        if (!payload?.parentId) {
          return { success: false, error: "缺少 parentId" };
        }

        const ids = Array.isArray(payload.orderedIds) ? payload.orderedIds : [];
        for (let index = 0; index < ids.length; index++) {
          applyMockAction({ type: "move", id: ids[index], parentId: payload.parentId, index });
        }
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
    get: async (id: string) => {
      const found = findNodeById(mockTree, id);
      return found ? [found] : [];
    },
    getChildren: async (id: string) => {
      const found = findNodeById(mockTree, id);
      return found?.children ?? [];
    },
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
    move: async (id: string, moveInfo: { parentId: string; index?: number }) => {
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

export const chromeApi: ChromeApi = useMock ? (mockChrome as unknown as ChromeApi) : chrome;
