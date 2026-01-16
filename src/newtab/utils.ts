export const getFaviconUrl = (pageUrl: string) => {
  try {
    const url = new URL(chrome.runtime.getURL("/_favicon/"));
    url.searchParams.set("pageUrl", pageUrl);
    url.searchParams.set("size", "64"); // Higher res for larger cards
    return url.toString();
  } catch {
    // Fallback if extension context is weird or during dev without extension env
    return `https://www.google.com/s2/favicons?domain=${new URL(pageUrl).hostname}&sz=64`;
  }
};
