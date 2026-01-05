# 技术设计: 开发时插件热重载

## 技术方案
### 核心技术
- Vite 5 开发服务器
- @crxjs/vite-plugin（MV3 热重载）
- WebSocket 通知 + chrome.runtime.reload

### 实现要点
- 将 manifest.json 迁移为 `src/manifest.ts` 以便插件接管 dev 构建
- 在 background/newtab 注入 dev reloader，接收更新通知后触发 runtime.reload 或页面刷新
- 建立 Chromium API shim，统一从 `src/shared/chrome.ts` 导出真实或 mock 实现
- `pnpm dev` 直接运行 Vite dev server，Edge 加载开发产物

## 架构决策 ADR
### ADR-001: 使用 @crxjs/vite-plugin 提供 MV3 开发时热重载
**上下文:** 需要在 Edge 上实现扩展级热重载，同时保持 Vite 现有构建流程。
**决策:** 采用 @crxjs/vite-plugin 接管 dev 构建与 HMR。
**理由:** 社区成熟、支持 MV3、减少自研 reload 管道。
**替代方案:** 自建 WebSocket + watch + chrome.runtime.reload → 拒绝原因: 维护成本高。
**影响:** 需要迁移 manifest 并调整构建配置。

## 安全与性能
- **安全:** dev-only 逻辑必须受环境变量门控，禁止进入生产构建
- **性能:** shim 仅在 dev 环境启用，生产路径无额外开销

## 测试与部署
- **测试:** 手动验证 dev 热重载与 shim 行为
- **部署:** 仅影响开发流程，无生产部署变更
