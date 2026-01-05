# 变更提案: 开发时插件热重载

## 需求背景
当前开发时需要手动重新加载扩展或刷新新标签页，迭代效率低。希望在 Edge 上执行 `pnpm dev` 后监听源码变更，自动重载整个扩展，并在开发模式下提供 API shim，让页面不依赖真实 Chromium API 也能运行。

## 变更内容
1. 引入扩展热重载方案，支持 Edge MV3 的开发时自动重载。
2. 增加 dev-only Chromium API shim，提供 bookmarks/storage/runtime 的最小可用 mock。
3. 调整开发脚本与配置，确保 `pnpm dev` 一键启动。

## 影响范围
- **模块:** extension-core、newtab-ui、bookmark-sync、storage、shared
- **文件:** vite.config.ts、package.json、src/manifest.ts（或 manifest.json 迁移）、src/shared/*、src/background/*、src/newtab/*
- **API:** chrome.runtime / chrome.bookmarks / chrome.storage（dev shim）
- **数据:** 本地 mock 数据（仅 dev）

## 核心场景

### 需求: dev_extension_hot_reload
**模块:** extension-core
开发时自动重载整个扩展，并允许在 dev 环境使用 mock 替代 Chromium API。

#### 场景: dev_watch_reload
在 Edge 中加载开发扩展后：
- 执行 `pnpm dev` 并保存任意源码
- 扩展自动重载，新标签页自动刷新
- 若处于 dev server 页面，Chrome API 调用走 mock，不阻塞页面渲染

## 风险评估
- **风险:** dev-only shim 或热重载逻辑进入生产构建
- **缓解:** 以 `import.meta.env.DEV` 或 `process.env.NODE_ENV` 严格门控，并在构建产物检查
