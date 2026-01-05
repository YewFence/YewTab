// 负责扩展开发热重载与打包输出配置。
import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import react from "@vitejs/plugin-react";
import manifest from "./src/manifest";

export default defineConfig({
  publicDir: false,
  plugins: [react(), crx({ manifest })],
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
