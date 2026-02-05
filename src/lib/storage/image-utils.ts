// 图片压缩工具函数

const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024; // 4MB
const INITIAL_QUALITY = 0.8;
const MIN_QUALITY = 0.3;

/**
 * 压缩图片为 Base64
 * @param file 用户上传的文件
 * @returns 压缩后的 Base64 字符串
 */
export async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("无法创建 Canvas 上下文"));
      return;
    }

    img.onload = () => {
      // 计算缩放尺寸
      let { width, height } = img;
      if (width > MAX_IMAGE_WIDTH) {
        height = (height * MAX_IMAGE_WIDTH) / width;
        width = MAX_IMAGE_WIDTH;
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // 尝试不同质量压缩
      let quality = INITIAL_QUALITY;
      let result = canvas.toDataURL("image/jpeg", quality);

      while (result.length > MAX_IMAGE_SIZE_BYTES && quality > MIN_QUALITY) {
        quality -= 0.1;
        result = canvas.toDataURL("image/jpeg", quality);
      }

      if (result.length > MAX_IMAGE_SIZE_BYTES) {
        reject(new Error("图片太大，压缩后仍超过 4MB 限制"));
        return;
      }

      // 释放 ObjectURL
      URL.revokeObjectURL(img.src);
      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("图片加载失败"));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 估算 Base64 数据大小（MB）
 */
export function estimateBase64SizeMB(base64: string): number {
  // Base64 编码后大小约为原数据的 4/3
  const padding = base64.match(/=+$/)?.[0]?.length ?? 0;
  const sizeBytes = (base64.length * 3) / 4 - padding;
  return sizeBytes / (1024 * 1024);
}

/**
 * 验证 URL 是否为有效的图片链接
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}
