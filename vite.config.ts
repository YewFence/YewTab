// 负责扩展开发热重载与打包输出配置。
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";
import manifest from "./src/manifest";

const getGitVersion = () => {
  try {
    // 只获取当前 commit 上的 tag，没有则返回 null
    // --points-at HEAD 确保只匹配当前 commit 的 tag
    const tag = execSync('git tag --points-at HEAD -l "v*"').toString().trim();
    // 可能有多个 tag，取第一个
    return tag.split("\n")[0] || null;
  } catch {
    return null;
  }
};

const getGitCommitHash = () => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
};

export default defineConfig({
  publicDir: false,
  plugins: [react(), tailwindcss(), crx({ manifest })],
  define: {
    __APP_VERSION__: JSON.stringify(getGitVersion() || "dev"),
    __GIT_COMMIT__: JSON.stringify(getGitCommitHash()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  build: {
    outDir: "dist"
  }
});
