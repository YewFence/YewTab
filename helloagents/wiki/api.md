# API 手册

## 概述
当前版本暂无对外 API，内部通信采用扩展消息机制。

## 认证方式
不涉及。

---

## 接口列表

### 扩展内部消息

#### MESSAGE load_bookmarks
**描述:** 触发读取书签并返回书签树。

**请求示例:**
```json
{ "type": "load_bookmarks", "source": "ui" }
```

**响应示例:**
```json
{ "tree": [], "updatedAt": "2026-01-05T10:00:00Z", "fromCache": false }
```

#### MESSAGE apply_bookmark_change
**描述:** 应用来自 UI 的新增/移动/删除操作。

**请求示例:**
```json
{ "type": "apply_bookmark_change", "payload": { "type": "create", "parentId": "1", "title": "示例", "url": "https://example.com" } }
```

**响应示例:**
```json
{ "success": true }
```

#### MESSAGE bookmarks_changed
**描述:** 后台检测到书签变化后广播，触发 UI 刷新。
