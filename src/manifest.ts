// 定义扩展的 Manifest 配置并交由构建插件处理。
import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "Yew Tab",
  version: "0.2.0",
  description: "用卡片方式展示 Edge 收藏夹。",
  permissions: ["bookmarks", "storage", "favicon"],
  host_permissions: ["http://localhost/*"],
  chrome_url_overrides: {
    newtab: "src/newtab/newtab.html"
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module"
  }
});
