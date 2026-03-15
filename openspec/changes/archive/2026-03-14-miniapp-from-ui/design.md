# 设计文档：miniapp-from-ui

## Context

- 仓库内已有 **Web 前端**（`ui/`）：React + Vite + Tailwind，7 个页面、统一设计系统（政务蓝、组件库），以及 **接口文档**（`接口文档.md`）描述的后端契约。
- **`miniapp/`** 目录已存在且为空，目标是在此实现微信小程序，与 Web 共享业务与接口，不新增后端。
- 约束：小程序需在微信开发者工具中可打开（导入编译产出目录）；视觉与交互需与 `ui` 设计一致，便于双端体验统一。

## Goals / Non-Goals

**Goals:**

- 在 `miniapp/` 下用 Taro（React）搭建可编译为微信小程序的项目，产出目录（如 `dist`）可直接被微信开发者工具导入。
- 实现与 `ui/PAGES_OVERVIEW.md` 对应的 7 个页面及导航关系。
- 组件与样式与 `ui/DESIGN_SYSTEM.md` 等设计规范对齐（主色、字号、圆角、布局）。
- 列表、详情、登录/注册、收藏等与现有接口对接，数据契约遵循 `接口文档.md`。

**Non-Goals:**

- 不改造现有 Web 端（`ui/`）或后端接口。
- 不实现 H5 或多端编译（本变更仅输出微信小程序）；后续扩展为多端可在设计上预留，但不作为本次交付。
- 不引入新的后端服务或数据库。

## Decisions

### 1. 使用 Taro（React）而非原生小程序或 uni-app

- **理由**：与现有 `ui/` 技术栈一致（React），业务逻辑与组件思维可复用，团队学习成本低；Taro 成熟且支持微信小程序为首选 target。
- **备选**：原生小程序——需重写全部 UI 与逻辑，维护两套代码。uni-app——以 Vue 为主，若坚持 React 则 Taro 更合适。

### 2. 小程序源码与产出目录均位于 `miniapp/` 下

- **结构**：`miniapp/src/` 为源码，Taro 编译输出到 `miniapp/dist/`（或 Taro 默认 outputRoot）；`project.config.json` 置于产出根目录，微信开发者工具打开 `miniapp/dist`。
- **理由**：与「把小程序写在该目录下」的约定一致，且不污染仓库根；CI 或本地脚本统一在 `miniapp/` 内执行 build。

### 3. 设计系统以 WXSS + 设计 token 复刻，不共享 Web 的 CSS 文件

- **理由**：小程序不支持直接使用 Web 的 Tailwind/PostCSS 管线；在 `miniapp` 内用 WXSS + 变量（或 Taro 支持的样式方案）复刻 `ui/DESIGN_SYSTEM.md` 中的颜色、字号、圆角等。
- **备选**：Taro 的 React 写法仍可写 className，通过 Taro 的样式编译到 WXSS，便于与 Web 侧命名习惯对齐。

### 4. 接口层抽象为独立模块，便于与 Web 共用类型与契约

- **理由**：请求 URL、参数、响应结构与 `接口文档.md` 一致；可在 `miniapp/src/services/` 或 `api/` 中封装，使用 Taro.request；若仓库根存在共享类型定义（如 TypeScript 类型），可考虑通过 workspace 或拷贝方式复用，减少与后端契约偏离。

### 5. 登录与鉴权

- **假设**：后端若已提供 token 或 session 机制，小程序端在请求头或参数中携带同一套鉴权信息；若当前接口文档未约定，则本次仅实现「能调通登录/列表/详情接口」的占位，具体 token 存储与刷新策略可在实现阶段按后端实际补充。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| Taro 与微信基础库版本兼容 | 在 `miniapp/` 的 package.json 中固定 Taro 与 @tarojs/cli 版本，并在 README 中注明推荐基础库版本。 |
| 筛选/弹层等复杂交互在小程序中的表现差异 | 严格按 `PAGES_OVERVIEW.md` 与设计系统实现，使用 Taro 的 ScrollView、Modal 等组件替代 Web 的 DOM 弹层；若遇限制则记录在 Open Questions 或后续迭代。 |
| 后端接口未就绪导致联调阻塞 | 先使用 Mock 或接口文档中的示例响应完成页面与组件开发，接口地址通过配置（如 env）切换。 |

## Migration Plan

- **部署**：无后端或 Web 变更，仅新增 `miniapp/` 内容；构建产物为本地或 CI 产出目录，上传小程序由微信开发者工具或 CI 脚本另行完成。
- **回滚**：删除或还原 `miniapp/` 下新增文件即可，不影响现有 Web 与爬虫。

## Open Questions

- 后端 API 的 base URL 与鉴权方式（token 头、cookie 等）是否已确定；若未确定，实现时使用占位配置并在 README 中说明。
- 是否将 `miniapp` 纳入仓库根 pnpm workspace，与 `ui` 等并列管理依赖（可选，不阻塞首版）。
