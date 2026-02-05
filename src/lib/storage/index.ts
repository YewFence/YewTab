// 封装书签快照与布局状态的读写。
import { chromeApi } from "../../shared/chrome";
import { SNAPSHOT_VERSION, STORAGE_KEYS } from "../../shared/constants";
import type { BookmarkSnapshot, BookmarkNode, LayoutState, SearchSettings, BackgroundSettings, ThemeBackground } from "../../shared/types";

const defaultLayoutState: LayoutState = {
  pinnedIds: [],
  lastOpenFolder: null,
  startupFolderId: null
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

export async function readLayoutState(): Promise<LayoutState> {
  const result = await chromeApi.storage.local.get(STORAGE_KEYS.LAYOUT);
  const stored = result[STORAGE_KEYS.LAYOUT] as Partial<LayoutState> | undefined;
  // 兼容旧版本：字段缺失时用默认值补齐。
  return { ...defaultLayoutState, ...(stored ?? {}) } as LayoutState;
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
