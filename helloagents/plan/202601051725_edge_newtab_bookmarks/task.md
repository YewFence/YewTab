# 任务清单: Edge 新标签页书签面板

目录: `helloagents/plan/202601051725_edge_newtab_bookmarks/`

---

## 1. 工程结构
- [√] 1.1 创建目录结构：`src/background`、`src/newtab/components`、`src/lib/{bookmarks,storage,messaging}`、`src/shared/{types,constants}`
- [√] 1.2 补齐必要配置文件（Vite + TypeScript + ESLint）与 `public/manifest.json` 骨架

## 2. extension-core
- [√] 2.1 在 `public/manifest.json` 中配置新标签页覆盖与权限，验证 why.md#需求-bookmark_sync-场景-initial_load
- [√] 2.2 在 `src/background/index.ts` 中实现消息路由与初始化，验证 why.md#需求-bookmark_sync-场景-edge_change

## 3. bookmark-sync
- [√] 3.1 在 `src/lib/bookmarks/index.ts` 中实现书签读取与变化监听，验证 why.md#需求-bookmark_sync-场景-initial_load
- [√] 3.2 在 `src/lib/bookmarks/index.ts` 中实现写回操作（新增/移动/删除），验证 why.md#需求-bookmark_sync-场景-ui_edit

## 4. newtab-ui
- [√] 4.1 在 `src/newtab/app.tsx` 中实现卡片化网格布局，验证 why.md#需求-newtab_layout-场景-grid_render
- [√] 4.2 在 `src/newtab/components/folder-card.tsx` 中实现文件夹展开交互，验证 why.md#需求-newtab_layout-场景-folder_card_open

## 5. storage
- [√] 5.1 在 `src/lib/storage/index.ts` 中实现书签快照与布局状态存储，验证 why.md#需求-offline_cache-场景-offline_render

## 6. build
- [√] 6.1 配置 `vite.config.ts` 多入口（newtab/background），并确保静态资源输出可用于扩展加载
  - 6.1.1 确认 `src/newtab/main.tsx` 与 `src/background/index.ts` 作为入口
  - 6.1.2 输出目录与 `public/manifest.json` 协同

## 7. 安全检查
- [√] 7.1 执行安全检查（输入过滤、权限最小化、离线缓存风险评估）

## 8. 文档更新
- [√] 8.1 更新 `helloagents/wiki/overview.md` 与相关模块文档

## 9. 测试
- [√] 9.1 在 `tests/manual/newtab.md` 中编写手动验收清单，覆盖首次加载/变化同步/离线展示
