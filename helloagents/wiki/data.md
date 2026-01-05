# 数据模型

## 概述
本地缓存仅用于离线展示与加速首屏渲染，最终以 Edge 书签为准。

---

## 数据结构

### bookmarks_snapshot
**描述:** 书签树快照

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| version | number | 非空 | 快照版本号 |
| updatedAt | string | 非空 | ISO 时间戳 |
| tree | object | 非空 | 书签树结构 |

### layout_state
**描述:** 新标签页布局与排序

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| pinnedIds | array | 非空 | 置顶书签/文件夹 ID 列表 |
| lastOpenFolder | string | 可空 | 最近打开文件夹 ID |
