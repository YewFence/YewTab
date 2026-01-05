# 任务清单: 开发时插件热重载

目录: `helloagents/plan/202601052304_dev_extension_hot_reload/`

---

## 1. 构建与热重载配置
- [ ] 1.1 在 `vite.config.ts` 引入 `@crxjs/vite-plugin` 并接入 manifest 配置，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload
- [ ] 1.2 在 `src/manifest.ts` 迁移 `public/manifest.json` 内容并调整资源路径，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload
- [ ] 1.3 在 `package.json` 调整 `dev` 脚本，确保 `pnpm dev` 启动扩展开发模式，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload

## 2. 开发时热重载触发
- [ ] 2.1 新增 `src/shared/dev-reload.ts` 实现 dev-only reload 逻辑，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload
- [ ] 2.2 在 `src/background/index.ts` 接入 dev reloader，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload
- [ ] 2.3 在 `src/newtab/app.tsx` 接入 dev reloader，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload

## 3. Chromium API shim
- [ ] 3.1 新增 `src/shared/chrome.ts`，在 dev 环境下提供 mock 实现，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload
- [ ] 3.2 在 `src/lib/bookmarks/index.ts`、`src/lib/storage/index.ts`、`src/lib/messaging/index.ts` 使用 shim 替代直接 `chrome`，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload
- [ ] 3.3 在 `src/background/index.ts`、`src/newtab/app.tsx` 使用 shim 替代直接 `chrome`，验证 why.md#需求-dev_extension_hot_reload-场景-dev_watch_reload

## 4. 安全检查
- [ ] 4.1 执行安全检查（按 G9: 输入验证、敏感信息处理、权限控制、EHRB 风险规避）

## 5. 文档更新
- [ ] 5.1 更新 `helloagents/wiki/modules/extension-core.md`
- [ ] 5.2 更新 `helloagents/wiki/modules/newtab-ui.md`

## 6. 测试
- [ ] 6.1 手动验证: `pnpm dev` 保存代码后扩展自动重载，新标签页自动刷新，mock API 可用
