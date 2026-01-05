# extension-core

## 目的
扩展入口、权限、页面覆盖与生命周期管理。

## 模块概述
- **职责:** manifest 与权限、消息路由、Background 初始化
- **状态:** ✅已实现
- **最后更新:** 2026-01-05

## 规范

### 需求: extension_bootstrap
**模块:** extension-core
负责新标签页覆盖与扩展启动流程。

#### 场景: extension_startup
扩展安装或浏览器启动后初始化。
- 初始化消息通道
- 预加载书签缓存

### 需求: dev_extension_hot_reload
**模块:** extension-core
开发时支持扩展级热重载与 dev API shim。

#### 场景: dev_watch_reload
执行 `pnpm dev` 后保存源码。
- 扩展自动重载
- 新标签页自动刷新

## 依赖
- bookmark-sync
- storage

## 变更历史
- 202601051725_edge_newtab_bookmarks - 初始化规划
- 202601051725_edge_newtab_bookmarks - 完成后台消息路由与书签监听
- 202601052304_dev_extension_hot_reload - 开发时热重载与 shim 接入
