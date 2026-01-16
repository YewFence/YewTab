# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

yew-tab 是一个基于 React + Vite 构建的浏览器扩展（Manifest V3），为 Edge/Chrome 提供自定义新标签页，以卡片形式展示和管理书签。

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（支持热重载）
pnpm dev

# 构建生产版本
pnpm build

# 代码检查
pnpm lint
```

**加载扩展到浏览器：**
1. 运行 `pnpm build`
2. 打开 `edge://extensions` 或 `chrome://extensions`
3. 启用"开发人员模式"
4. 点击"加载解压缩的扩展"，选择 `dist/` 目录

## 架构设计

### 前后端分离 + 消息驱动架构

```
┌─────────────────────────────────────────┐
│  Frontend: React 新标签页 (newtab/)      │
│  └─ 通过 chrome.runtime.sendMessage     │
│     与后台通信                           │
├─────────────────────────────────────────┤
│  Backend: Service Worker (background/)   │
│  └─ 处理书签 CRUD、缓存同步、消息路由     │
├─────────────────────────────────────────┤
│  Chrome APIs                            │
│  └─ bookmarks / storage / runtime       │
└─────────────────────────────────────────┘
```

### 核心模块职责

- **src/newtab/** - React 前端应用，包含 UI 组件和应用入口
- **src/background/** - Service Worker 后台脚本，消息路由与书签监听
- **src/lib/** - 核心业务逻辑
  - `bookmarks/` - Chrome Bookmarks API 封装
  - `messaging/` - 前后端消息通信封装
  - `storage/` - 书签快照与布局状态持久化
- **src/shared/** - 前后端共享的类型定义和常量

### 数据流

1. **书签加载**: 前端 → messaging → background → chrome.bookmarks.getTree() → 返回树结构
2. **书签变更**: 前端操作 → messaging → background → chrome.bookmarks API → 更新缓存 → 广播变更消息
3. **离线降级**: 后台自动维护书签快照，前端获取失败时降级到本地缓存

## 代码规范

- **文件命名**: kebab-case（如 `bookmark-card.tsx`）
- **组件风格**: 函数式组件 + Hooks
- **提交规范**: 约定式提交，使用中文（如 `feat: 搜索框`）
- **语言**: 代码注释、文档、提交信息均使用中文

## 关键文件

- `src/manifest.ts` - 扩展 Manifest V3 配置
- `src/newtab/app.tsx` - 主应用组件
- `src/background/index.ts` - 后台服务入口
- `src/shared/types/index.ts` - 核心类型定义
- `src/shared/constants/index.ts` - 消息类型常量
