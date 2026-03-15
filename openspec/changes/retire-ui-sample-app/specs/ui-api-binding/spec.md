## REMOVED Requirements

### Requirement: 前端可配置 API base URL
**Reason**: `ui` 样例工程被整体退役，不再作为正式前端存在，因此不再需要维护其 API base URL 配置要求。
**Migration**: 若未来需要新的 Web 前端，应在新的正式工程中重新定义 API base URL 配置方式，而不是沿用 `ui` 的约束。

### Requirement: 首页列表从 API 获取数据
**Reason**: 该 requirement 绑定的是 `ui` 前端首页与后端 API 的接线方式；随着 `ui` 退役，该前端行为不再属于正式系统范围。
**Migration**: 正式用户端继续由 `miniapp` 承担列表查询能力；若未来重建 Web 用户端，应在新的 capability 中重新声明列表 API 绑定要求。

### Requirement: 招投标详情页从 API 获取数据
**Reason**: 该 requirement 只约束 `ui` 前端详情页与 API 的绑定，退役 `ui` 后不再需要保留。
**Migration**: 正式详情页能力由 `miniapp` 保留；新的 Web 详情页若有需要，应在新方案中重新定义。

### Requirement: 保留现有设计系统与路由
**Reason**: `ui` 样例工程及其路由、组件结构、设计系统不再是正式交付的一部分。
**Migration**: 后续若需要新的 Web 前端或管理后台，应基于新的正式信息架构与设计系统重新定义，而不是承接 `ui` 样例约束。
