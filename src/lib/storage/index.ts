// 封装书签快照与布局状态的读写。
import { chromeApi } from "../../shared/chrome";
import { SNAPSHOT_VERSION, STORAGE_KEYS } from "../../shared/constants";
import type { BookmarkSnapshot, BookmarkNode, LayoutState, SearchSettings } from "../../shared/types";

const defaultLayoutState: LayoutState = {
  pinnedIds: [],
  lastOpenFolder: null
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
  return (result[STORAGE_KEYS.LAYOUT] as LayoutState | undefined) ?? defaultLayoutState;
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
