## ADDED Requirements

### Requirement: 仓库 SHALL 不再保留 `ui` 样例工程
系统 SHALL 将 `ui` 目录视为已退役样例工程，并从主仓库中移除；后续实现不得再把该目录作为正式用户端或正式管理后台的承载位置。

#### Scenario: 清理样例工程
- **WHEN** 本次 change 被应用
- **THEN** 仓库中不再保留 `ui/` 目录及其页面、路由、构建配置和依赖文件

#### Scenario: 后续需求评审
- **WHEN** 团队讨论正式前端或正式后台的承载方式
- **THEN** 不再默认以 `ui` 作为现成工程继续迭代，而是基于新的正式方案重新立项

### Requirement: 正式系统边界 SHALL 收敛到 `crawler`、`server`、`miniapp`
项目文档和需求描述 SHALL 将正式系统边界明确为 `crawler`、`server`、`miniapp` 三部分；`ui` MUST NOT 再被列为正式系统组成部分。

#### Scenario: 查看项目架构文档
- **WHEN** 开发者阅读项目架构、需求清单或联调说明
- **THEN** 文档仅将 `crawler`、`server`、`miniapp` 识别为正式系统，并明确 `ui` 已退役或不在交付范围内

#### Scenario: 评估正式用户端
- **WHEN** 团队确认当前正式用户端
- **THEN** 文档和需求均以 `miniapp` 为唯一正式用户端，而不是把 `ui` 与 `miniapp` 并列

### Requirement: 样例 UI 退役 SHALL 不删除既有服务端管理能力
退役 `ui` 样例工程时，系统 SHALL 保留已有的服务端管理接口和采集控制接口；前端样例移除 MUST NOT 被解释为对应后端能力一并废弃。

#### Scenario: 删除样例前端后检查管理接口
- **WHEN** `ui` 已从仓库中移除
- **THEN** `server` 中现有 `/api/admin/*` 接口仍作为服务能力存在，除非另有 change 明确废弃

#### Scenario: 后续重建正式后台
- **WHEN** 团队未来需要重新提供 Web 管理后台
- **THEN** 可以基于现有服务端接口重新建设，而不是恢复 `ui` 样例工程作为默认实现
