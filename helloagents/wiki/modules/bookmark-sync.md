# bookmark-sync

## 目的
与 Edge 本地收藏夹双向同步。

## 模块概述
- **职责:** 读取书签树、监听变化、应用 UI 改动
- **状态:** ✅已实现
- **最后更新:** 2026-01-05

## 规范

### 需求: bookmark_sync
**模块:** bookmark-sync
提供书签读取与双向同步能力。

#### 场景: initial_load
首次打开新标签页时加载书签。
- 返回完整书签树
- 通知 UI 完成渲染

#### 场景: edge_change
Edge 收藏夹发生变化。
- 更新缓存
- 增量更新 UI

#### 场景: ui_edit
用户在新标签页内新增/移动/删除。
- 调用书签 API 应用变更

## 依赖
- storage

## 变更历史
- 202601051725_edge_newtab_bookmarks - 初始化规划
- 202601051725_edge_newtab_bookmarks - 完成书签读取与写回逻辑
