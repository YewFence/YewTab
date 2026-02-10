// Web 版本的 Vite 配置，用于构建静态演示站点
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { execSync } from "child_process";

const getGitVersion = () => {
  try {
    const tag = execSync('git tag --points-at HEAD -l "v*"').toString().trim();
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
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(getGitVersion() || "dev"),
    __GIT_COMMIT__: JSON.stringify(getGitCommitHash()),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  root: "./src/newtab",
  publicDir: false,
  build: {
    outDir: "../../dist-web",
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    strictPort: false,
  },
});
