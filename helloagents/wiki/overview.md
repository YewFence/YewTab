# yew-tab

> 本文件包含项目级别的核心信息。详细的模块文档见 `modules/` 目录。

---

## 1. 项目概述

### 目标与背景
在 Edge 新标签页中以卡片方式展示收藏夹，并与本地收藏夹双向同步。

### 范围
- **范围内:** 新标签页 UI、收藏夹读取与同步、离线缓存展示
- **范围外:** 跨设备云同步、跨浏览器支持、账号体系

### 干系人
- **负责人:** 叶云枫

---

## 2. 模块索引

| 模块名称 | 职责 | 状态 | 文档 |
|---------|------|------|------|
| extension-core | 扩展入口与权限配置 | ✅已实现 | [链接](modules/extension-core.md) |
| bookmark-sync | 收藏夹读取与同步 | ✅已实现 | [链接](modules/bookmark-sync.md) |
| newtab-ui | 新标签页展示与交互 | ✅已实现 | [链接](modules/newtab-ui.md) |
| storage | 本地缓存与偏好设置 | ✅已实现 | [链接](modules/storage.md) |

---

## 3. 快速链接
- [技术约定](../project.md)
- [架构设计](arch.md)
- [API 手册](api.md)
- [数据模型](data.md)
- [变更历史](../history/index.md)
