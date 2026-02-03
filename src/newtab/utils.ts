const DEFAULT_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";

export const getFaviconUrl = (pageUrl: string) => {
  try {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", "64"); // Higher res for larger cards
    return url.toString();
  } catch {
    // Fallback if extension context is weird or during dev without extension env
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(pageUrl).hostname}&sz=64`;
    } catch {
      return DEFAULT_ICON;
    }
  }
};
