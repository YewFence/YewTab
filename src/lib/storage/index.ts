// 封装书签快照与布局状态的读写。
import { chromeApi } from "../../shared/chrome";
import { SNAPSHOT_VERSION, STORAGE_KEYS } from "../../shared/constants";
import type { BookmarkSnapshot, BookmarkNode, LayoutState, SearchSettings, BackgroundSettings, ThemeBackground } from "../../shared/types";

const defaultLayoutState: LayoutState = {
  pinnedIds: [],
  lastOpenFolder: null,
  startupFolderId: null,
  keepFolderExpansion: true,
  expandedFolderIds: [],
  expandedStateTree: {},
  expandedStateVersion: 2,
  openInNewTab: false
};

export async function readBookmarkSnapshot(): Promise<BookmarkSnapshot | null> {
  const result = await chromeApi.storage.local.get(STORAGE_KEYS.SNAPSHOT);
  return (result[STORAGE_KEYS.SNAPSHOT] as BookmarkSnapshot | undefined) ?? null;
}

export async function writeBookmarkSnapshot(tree: BookmarkNode[]): Promise<BookmarkSnapshot> {
  const snapshot: BookmarkSnapshot = {
    version: SNAPSHOT_VERSION,
    updatedAt: new Date().toISOString(),
    tree
  };
  await chromeApi.storage.local.set({ [STORAGE_KEYS.SNAPSHOT]: snapshot });
  return snapshot;
}

/**
 * 从旧的扁平数组迁移到树形结构
 * 需要遍历书签树,构建父子关系映射,按层级组织展开状态
 */
function migrateExpandedState(
  tree: BookmarkNode[],
  oldExpandedIds: string[]
): Record<string, string[]> {
  const expandedStateTree: Record<string, string[]> = {};

  // 构建父子关系映射: 子ID -> 父ID
  const parentMap = new Map<string, string>();

  function buildParentMap(nodes: BookmarkNode[], parentId: string) {
    for (const node of nodes) {
      if (!node.url) {  // 只处理文件夹
        parentMap.set(node.id, parentId);
        if (node.children) {
          buildParentMap(node.children, node.id);
        }
      }
    }
  }

  const rootNodes = tree[0]?.children ?? [];
  buildParentMap(rootNodes, "__root__");

  // 按父子关系组织展开状态
  for (const expandedId of oldExpandedIds) {
    const parentId = parentMap.get(expandedId) ?? "__root__";
    if (!expandedStateTree[parentId]) {
      expandedStateTree[parentId] = [];
    }
    expandedStateTree[parentId].push(expandedId);
  }

  return expandedStateTree;
}

export async function readLayoutState(tree?: BookmarkNode[]): Promise<LayoutState> {
  const result = await chromeApi.storage.local.get(STORAGE_KEYS.LAYOUT);
  const stored = result[STORAGE_KEYS.LAYOUT] as Partial<LayoutState> | undefined;
  const layoutState = { ...defaultLayoutState, ...(stored ?? {}) } as LayoutState;

  // 检测并迁移旧版本数据
  if (
    tree &&
    layoutState.expandedFolderIds &&
    layoutState.expandedFolderIds.length > 0 &&
    (!layoutState.expandedStateVersion || layoutState.expandedStateVersion === 1)
  ) {
    console.log("[Migration] Converting expandedFolderIds to expandedStateTree");

    const migratedState = {
      ...layoutState,
      expandedStateTree: migrateExpandedState(
        tree,
        layoutState.expandedFolderIds
      ),
      expandedStateVersion: 2 as const,
      expandedFolderIds: []
    };

    // 立即写回
    await writeLayoutState(migratedState);
    return migratedState;
  }

  return layoutState;
}

export async function writeLayoutState(nextState: LayoutState): Promise<void> {
  await chromeApi.storage.local.set({ [STORAGE_KEYS.LAYOUT]: nextState });
}

const defaultSearchSettings: SearchSettings = {
  defaultEngine: "google"
};

export async function readSearchSettings(): Promise<SearchSettings> {
  const result = await chromeApi.storage.local.get(STORAGE_KEYS.SEARCH_SETTINGS);
  return (result[STORAGE_KEYS.SEARCH_SETTINGS] as SearchSettings | undefined) ?? defaultSearchSettings;
}

export async function writeSearchSettings(settings: SearchSettings): Promise<void> {
  await chromeApi.storage.local.set({ [STORAGE_KEYS.SEARCH_SETTINGS]: settings });
}

// 背景设置
const defaultThemeBackground: ThemeBackground = {
  type: "gradient",
  imagePosition: "cover",
  overlayOpacity: 30
};

const defaultBackgroundSettings: BackgroundSettings = {
  light: { ...defaultThemeBackground },
  dark: { ...defaultThemeBackground }
};

export async function readBackgroundSettings(): Promise<BackgroundSettings> {
  const result = await chromeApi.storage.local.get(STORAGE_KEYS.BACKGROUND_SETTINGS);
  const stored = result[STORAGE_KEYS.BACKGROUND_SETTINGS] as Partial<BackgroundSettings> | undefined;
  // 兼容旧版本：字段缺失时用默认值补齐
  return {
    light: { ...defaultThemeBackground, ...(stored?.light ?? {}) },
    dark: { ...defaultThemeBackground, ...(stored?.dark ?? {}) }
  };
}

export async function writeBackgroundSettings(settings: BackgroundSettings): Promise<void> {
  await chromeApi.storage.local.set({ [STORAGE_KEYS.BACKGROUND_SETTINGS]: settings });
}
