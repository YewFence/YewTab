// 负责扩展开发热重载与打包输出配置。
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";
import manifest from "./src/manifest";

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
