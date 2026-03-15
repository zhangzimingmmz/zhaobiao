## ADDED Requirements

### Requirement: 控制面 SHALL 以异步状态机执行手工请求
服务端 SHALL 以异步状态机执行受支持的手工 crawl 请求，至少支持 `queued`、`running`、`succeeded`、`failed`、`rejected` 状态，并为每次请求保留唯一 run 标识。

#### Scenario: 合法请求进入执行状态机
- **WHEN** 管理员提交一个通过校验的手工请求
- **THEN** 系统创建唯一 run 记录，并使其先进入 `queued` 状态，再由 dispatcher 推进到 `running` 和最终状态

#### Scenario: 任务执行失败
- **WHEN** 某个已启动任务以非成功退出码结束或执行过程中抛出异常
- **THEN** 系统将该 run 标记为 `failed`，并记录失败摘要

### Requirement: 控制面 SHALL 对同一站点执行排他保护
控制面 SHALL 对同一站点的手工执行采用排他保护，防止互相冲突的任务在同一站点上并行运行。

#### Scenario: 站点已有运行中的手工任务
- **WHEN** site1 或 site2 已经存在一个 `running` 的控制面任务
- **THEN** 系统拒绝新的同站点手工请求，并返回“该站点已有运行中的任务”之类的明确信息

#### Scenario: 不同站点可并行执行
- **WHEN** site1 已有运行中的手工任务，而管理员请求 site2 的受支持任务
- **THEN** 系统仍可接受并执行该 site2 请求

### Requirement: 受支持任务 SHALL 通过受控适配器执行
服务端 SHALL 通过受控任务适配器执行白名单任务，而不是接受任意模块名或任意命令行参数；适配器 MUST 负责参数映射、日志落点和结果摘要回填。

#### Scenario: 执行白名单任务
- **WHEN** dispatcher 认领一个已受理的手工请求
- **THEN** 它通过该动作对应的受控适配器启动任务，并将输出写入受控位置

#### Scenario: 请求试图绕过适配器边界
- **WHEN** 请求包含未定义参数、未注册动作或试图扩展到底层任意命令
- **THEN** 系统拒绝该请求，而不是将其传递给底层执行器

### Requirement: 手工执行 SHALL 与运行历史保持统一审计语义
控制面产生的手工执行记录 SHALL 写入统一的运行历史语义，至少包含 `triggerSource=admin`、请求人、参数摘要、开始/结束时间、最终状态和结果摘要。

#### Scenario: 查看手工执行历史
- **WHEN** 管理员在运行历史中查看某次手工触发
- **THEN** 系统展示该次运行由后台触发、由谁请求、携带了哪些参数摘要以及最终状态

#### Scenario: worker 重启导致运行中断
- **WHEN** dispatcher 或 API 进程重启，导致某个 `running` 的手工任务失去执行上下文
- **THEN** 系统在恢复阶段将该任务标记为失败或中断状态，并保留可读原因，而不是无限停留在 `running`
