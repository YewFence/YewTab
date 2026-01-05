// 封装与后台的消息通信请求。
import { chromeApi } from "../../shared/chrome";
import { MESSAGE_TYPES } from "../../shared/constants";
import type { ApplyBookmarkChangeResponse, BookmarkAction, LoadBookmarksResponse } from "../../shared/types";

export async function requestBookmarks(): Promise<LoadBookmarksResponse> {
  return chromeApi.runtime.sendMessage({
    type: MESSAGE_TYPES.LOAD_BOOKMARKS,
    source: "ui"
  }) as Promise<LoadBookmarksResponse>;
}

export async function applyBookmarkChange(action: BookmarkAction): Promise<ApplyBookmarkChangeResponse> {
  return chromeApi.runtime.sendMessage({
    type: MESSAGE_TYPES.APPLY_BOOKMARK_CHANGE,
    payload: action,
    source: "ui"
  }) as Promise<ApplyBookmarkChangeResponse>;
}
