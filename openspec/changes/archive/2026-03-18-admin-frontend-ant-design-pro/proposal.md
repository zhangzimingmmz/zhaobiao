# admin-frontend Ant Design Pro 迁移

## Why

当前 admin-frontend 使用纯 React + 手写 CSS（`styles.css`），布局、表格、表单均自研，存在设计系统不统一、维护成本高、扩展困难等问题。运营后台是典型的数据密集场景（列表、筛选、表单、详情），采用 Ant Design Pro 可显著提升开发效率与一致性，同时获得 ProLayout、ProTable、ProForm 等开箱即用的后台组件。

## What Changes

- **技术栈升级**：引入 Ant Design、ProComponents（ProLayout、ProTable、ProForm、ProDescriptions），替换现有手写布局与样式
- **布局重构**：使用 ProLayout 替代自定义 `Layout.tsx`，统一侧边栏、顶栏、面包屑
- **页面迁移**：总览、企业审核、企业目录、采集控制、运行记录、内容管理共 6 个模块的列表/详情/表单页迁移至 Pro 组件
- **路由与鉴权**：保持现有 `history.pushState` 或迁移至 React Router，登录与路由守卫逻辑不变
- **API 对接**：保持现有 `lib/api.ts` 与后端接口契约，仅调整调用方式与数据展示
- **移除**：删除 `styles.css` 中与布局、表格、表单相关的自定义样式，保留必要的业务样式（如有）

## Capabilities

### New Capabilities

- `admin-frontend-ui`: 运营后台前端 UI 体系，包含布局壳层、导航、登录、总览、企业审核、企业目录、采集控制、运行记录、内容管理各页面的展示与交互，基于 Ant Design Pro 实现

### Modified Capabilities

- 无。现有 `admin-crawl-run-monitoring`、`admin-crawl-run-control`、`admin-crawl-run-history` 等 spec 描述的是后端/业务能力，本次变更仅改变前端实现方式，不改变需求与接口契约

## Impact

- **代码**：`admin-frontend/` 全量重构，`package.json` 新增 antd、@ant-design/pro-components、dayjs 等依赖
- **构建**：Vite 配置可能需要调整以支持 Ant Design 的按需引入或主题
- **部署**：无变化，仍通过现有 docker-compose 与静态资源部署
- **其他模块**：server、miniapp、crawler 不受影响
