// HTML 书签导入
import type { ImportHtmlOptions, ImportHtmlResult } from "@/shared/types";

/**
 * 解析 Netscape Bookmark HTML 格式
 * @param htmlContent HTML 内容
 * @returns 解析后的书签结构
 */
function parseBookmarkHtml(htmlContent: string): { title: string; url?: string; children?: ReturnType<typeof parseBookmarkHtml>[] }[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const result: { title: string; url?: string; children?: ReturnType<typeof parseBookmarkHtml>[] }[] = [];

  // 找到根 DL 元素
  const rootDl = doc.querySelector("DL");
  if (!rootDl) {
    return result;
  }

  const parseDl = (dl: Element): typeof result => {
    const items: typeof result = [];
    const children = Array.from(dl.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];

      if (child.tagName === "DT") {
        // 检查是文件夹还是书签
        const h3 = child.querySelector(":scope > H3");
        const a = child.querySelector(":scope > A");

        if (h3) {
          // 文件夹
          const folderName = h3.textContent ?? "未命名文件夹";
          // 查找紧跟的 DL 元素
          const nextDl = children[i + 1]?.tagName === "DL" ? children[i + 1] : child.querySelector(":scope > DL");

          items.push({
            title: folderName,
            children: nextDl ? parseDl(nextDl) : []
          });

          // 如果 DL 是下一个兄弟节点，跳过它
          if (children[i + 1]?.tagName === "DL") {
            i++;
          }
        } else if (a) {
          // 书签
          items.push({
            title: a.textContent ?? "未命名书签",
            url: a.getAttribute("href") ?? undefined
          });
        }
      }
    }

    return items;
  };

  return parseDl(rootDl);
}

/**
 * 递归创建书签和文件夹
 * @param items 解析后的书签结构
 * @param parentId 父文件夹 ID
 * @returns 导入结果统计
 */
async function createBookmarks(
  items: ReturnType<typeof parseBookmarkHtml>,
  parentId: string
): Promise<{ bookmarkCount: number; folderCount: number; errors: string[] }> {
  let bookmarkCount = 0;
  let folderCount = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      if (item.children) {
        // 创建文件夹
        const folder = await chrome.bookmarks.create({
          parentId,
          title: item.title
        });
        folderCount++;

        // 递归创建子项
        const subResult = await createBookmarks(item.children, folder.id);
        bookmarkCount += subResult.bookmarkCount;
        folderCount += subResult.folderCount;
        errors.push(...subResult.errors);
      } else if (item.url) {
        // 创建书签
        await chrome.bookmarks.create({
          parentId,
          title: item.title,
          url: item.url
        });
        bookmarkCount++;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "未知错误";
      errors.push(`创建 "${item.title}" 失败: ${msg}`);
    }
  }

  return { bookmarkCount, folderCount, errors };
}

/**
 * 导入 HTML 书签文件
 * @param htmlContent HTML 文件内容
 * @param options 导入选项
 * @returns 导入结果
 */
export async function importBookmarksFromHtml(
  htmlContent: string,
  options: ImportHtmlOptions
): Promise<ImportHtmlResult> {
  const errors: string[] = [];

  try {
    // 验证目标文件夹是否存在
    try {
      await chrome.bookmarks.get(options.targetFolderId);
    } catch {
      return {
        success: false,
        importedCount: 0,
        folderCount: 0,
        errors: [`目标文件夹不存在: ${options.targetFolderId}`]
      };
    }

    // 解析 HTML
    const parsedBookmarks = parseBookmarkHtml(htmlContent);

    if (parsedBookmarks.length === 0) {
      return {
        success: false,
        importedCount: 0,
        folderCount: 0,
        errors: ["无法解析书签文件，可能格式不正确"]
      };
    }

    // 创建书签
    const result = await createBookmarks(parsedBookmarks, options.targetFolderId);

    return {
      success: result.errors.length === 0,
      importedCount: result.bookmarkCount,
      folderCount: result.folderCount,
      errors: result.errors
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "未知错误";
    errors.push(`导入失败: ${msg}`);
    return {
      success: false,
      importedCount: 0,
      folderCount: 0,
      errors
    };
  }
}
