# newtab-ui

## 目的
提供类 iOS 主屏幕风格的书签卡片展示。

## 模块概述
- **职责:** 卡片布局渲染、文件夹展开、交互触发
- **状态:** ✅已实现
- **最后更新:** 2026-01-05

## 规范

### 需求: newtab_layout
**模块:** newtab-ui
以卡片方式展示书签和文件夹。

#### 场景: grid_render
渲染 iOS 风格网格布局。
- 文件夹和书签均展示为卡片
- 保留文件夹层级

#### 场景: folder_card_open
打开文件夹查看内部书签。
- 展示子级列表
- 支持返回上一级

### 需求: dev_extension_hot_reload
**模块:** newtab-ui
开发时支持新标签页热重载与 mock API。

#### 场景: dev_watch_reload
执行 `pnpm dev` 后保存源码。
- 新标签页自动刷新
- mock API 可返回书签数据

## 依赖
- bookmark-sync
- storage

## 变更历史
- 202601051725_edge_newtab_bookmarks - 初始化规划
- 202601051725_edge_newtab_bookmarks - 完成网格布局与文件夹展开交互
- 202601052304_dev_extension_hot_reload - 新标签页热重载与 mock API
