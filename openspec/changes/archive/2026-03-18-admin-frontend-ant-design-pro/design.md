# admin-frontend Ant Design Pro 技术设计

## Context

- **现状**：admin-frontend 为 React 18 + Vite 5 + TypeScript，无 UI 库，使用单一 `styles.css`（约 330 行）实现布局、侧边栏、表格、表单等。页面包括：登录、总览、企业审核（列表+详情）、企业目录、采集控制、运行记录（列表+详情）、内容管理（列表+编辑）。
- **约束**：单运营最简版，无 RBAC；API 契约已定（见 `docs/others/后台管理接口文档.md`）；部署方式不变（Docker Compose 静态资源）。
- **利益相关**：运营人员使用，需保证功能等价、体验不降级。

## Goals / Non-Goals

**Goals:**

- 用 Ant Design Pro 替代手写 UI，统一设计系统
- 保持现有功能与 API 对接不变
- 提升后续扩展与维护效率

**Non-Goals:**

- 不改变后端接口
- 不引入 React Router（可保留 `history.pushState` 或后续再迁）
- 不做 RBAC、国际化、主题切换

## Decisions

### 1. 使用 Ant Design Pro 脚手架 vs 在现有 Vite 工程中引入

**选择**：在现有 `admin-frontend` 中引入 antd、@ant-design/pro-components，不新建 Pro 脚手架工程。

**理由**：现有工程结构清晰，路由与 API 已就绪；Pro 脚手架基于 Umi，与当前 Vite 栈不同，迁移成本高。直接引入 Pro 组件即可满足需求。

**备选**：新建 Umi + Pro 工程再迁移页面——工作量大，且需重写路由与 API 层。

### 2. ProLayout 配置方式

**选择**：使用 ProLayout 的 `route` 配置驱动菜单，`location.pathname` 与 `onMenuClick` 与现有 `navigate` 逻辑对接。

**理由**：ProLayout 支持 `route.routes` 定义菜单结构，可与当前 `NAV_ITEMS` 一一对应；`location` 可由 `window.location.pathname` 提供，无需 React Router。

**备选**：引入 React Router，用 `useLocation` / `useNavigate` 与 ProLayout 集成——更规范，但本次可先保持简单。

### 3. ProTable 数据源模式

**选择**：使用 ProTable 的 `request` 属性，传入 `(params) => api.xxx(params)` 形式的异步函数，由 ProTable 管理分页、筛选、加载状态。

**理由**：与现有 `lib/api.ts` 的接口风格兼容；ProTable 自动处理 loading、分页、空状态。

**备选**：`dataSource` + 手动分页——需自行管理状态，代码更多。

### 4. 样式与主题

**选择**：使用 Ant Design 默认主题，通过 ConfigProvider 的 `theme` 做轻量定制（如主色、圆角），不引入 Less。

**理由**：Vite 工程默认用 CSS，Ant Design v5 已支持 CSS-in-JS，无需 Less；单运营后台对品牌要求不高，默认主题即可。

**备选**：Less + 主题变量——适合需要深度定制的场景，本次不必要。

### 5. 按需引入 vs 全量引入

**选择**：全量引入 antd 与 @ant-design/pro-components，不配置 babel-plugin-import。

**理由**：Vite 的 tree-shaking 已能减少未用组件的体积；admin 为内网使用，包体积敏感度低；按需引入需额外配置，收益有限。

**备选**：按需引入——可减小 bundle，但配置复杂，且 Pro 组件内部依赖较多，实际节省有限。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| ProLayout 与无 React Router 的集成可能踩坑 | 优先用 `location.pathname` + `onMenuClick` 手动同步，必要时再引入 React Router |
| Ant Design 包体积较大 | 内网后台可接受；若后续有需求可再评估按需引入 |
| 迁移期间功能回归 | 按页面逐个迁移，每完成一页做一次手工验证 |
| ProComponents 与 Ant Design 版本兼容 | 使用官方推荐的版本组合（antd 5.x + @ant-design/pro-components 2.x） |

## Migration Plan

1. **依赖安装**：`npm install antd @ant-design/pro-components dayjs`
2. **布局迁移**：新建 ProLayout 壳层，替换 `Layout.tsx`，保留 `App.tsx` 路由逻辑
3. **页面迁移**：按 Dashboard → Reviews → Companies → Crawl → Runs → Articles 顺序，逐页用 Pro 组件重写
4. **清理**：删除 `styles.css` 中已由 Ant Design 覆盖的样式
5. **验证**：本地 `npm run dev` 全流程走通，部署到测试环境验证
6. **回滚**：保留原代码在 git 历史，若有问题可回退到迁移前提交

## Open Questions

- 无。技术方案已明确，可直接进入实现。
