## ADDED Requirements

### Requirement: Compose 部署 SHALL 提供独立的 API 与 scheduler 服务
系统的容器化部署 SHALL 至少定义 `api` 和 `scheduler` 两类服务，并通过同一套 Compose 配置描述服务关系、环境变量和持久卷挂载。

#### Scenario: 启动 Compose 部署
- **WHEN** 运维人员按文档启动容器化部署
- **THEN** 系统同时具备可提供 HTTP 接口的 `api` 服务和可定时提交 routine 任务的 `scheduler` 服务

### Requirement: API 运行时 SHALL 以单实例持有 dispatcher
容器化部署中的 `api` 服务 SHALL 以单实例运行，并继续在 API 进程内持有 crawl dispatcher；部署方案 MUST 不要求多副本或多 worker 作为正常运行前提。

#### Scenario: 启动 API 服务
- **WHEN** `api` 容器启动并初始化后端应用
- **THEN** 系统在该单实例内启动 dispatcher，并作为唯一的 routine/manual run 执行者

### Requirement: scheduler SHALL 通过控制面 API 提交 routine 任务
定时调度服务 SHALL 通过管理控制面提交受支持的 routine 任务，而不是绕过控制面直接执行底层 crawler CLI；这类提交 MUST 复用既有的动作白名单、站点排他保护和运行历史语义。

#### Scenario: 定时触发 site2 incremental
- **WHEN** scheduler 到达 `site2.incremental` 的预定时间
- **THEN** 它向控制面提交新的 run request，并使该任务进入统一的 run queue 与历史记录

#### Scenario: 定时任务与人工触发冲突
- **WHEN** 某站点已经存在一个运行中的控制面任务，而 scheduler 再次提交同站点 routine 任务
- **THEN** 系统沿用既有排他规则拒绝或延后该请求，而不是并行绕开执行

### Requirement: 容器化运行时 SHALL 持久化数据库与日志
容器化部署 SHALL 将 SQLite 数据文件和 crawler/控制面日志写入宿主机或命名持久卷，确保容器重建后数据与排障信息仍可保留。

#### Scenario: 重建 API 容器
- **WHEN** 运维人员重新创建 `api` 容器
- **THEN** `NOTICES_DB` 指向的数据库内容和日志目录内容仍然可用，不会因容器替换而丢失

### Requirement: 容器化部署 SHALL 外置运行配置与敏感信息
容器化部署 SHALL 通过环境变量或等效外部配置显式提供运行所需的数据库路径、管理员令牌、JWT 密钥和 scheduler 调用参数；部署方案 MUST 不依赖代码中的开发默认值作为生产-like 配置。

#### Scenario: 准备新环境部署
- **WHEN** 运维人员将系统迁移到新的服务器或环境
- **THEN** 其部署配置中明确包含必需环境变量与密钥来源，而不是依赖源码内置默认值

### Requirement: 容器镜像 SHALL 包含 crawler 的完整运行时依赖
用于容器化部署的运行镜像 SHALL 同时满足 API 与 crawler 的执行需要，包括 `site2` 当前 transport 依赖在内；scheduler 成功提交任务后，实际执行 MUST 能在容器内完成 import 与运行。

#### Scenario: 调度 site2 routine 任务
- **WHEN** scheduler 通过控制面提交 `site2.incremental` 或 `site2.recovery`
- **THEN** API/dispatcher 在容器内启动对应 crawler 模块时，不会因为缺少 transport 或 OCR 依赖而在导入阶段失败
