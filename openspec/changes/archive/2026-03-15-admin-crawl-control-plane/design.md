## Context

`admin-crawl-ops-console` 已经把采集后台重新定义为“观测优先”的只读控制台：先展示 run snapshot、数据 freshness 和运行历史，再把 manual trigger / control-plane 单独拆出来。这个 follow-up change 的职责，就是在现有 FastAPI + SQLite + crawler 脚本入口的约束下，为后台增加一套**安全、可审计、受边界约束**的手工执行模型。

当前代码现实是：
- crawler 任务已经有明确入口：site1 / site2 的 `incremental`、`recovery`、`backfill`，以及 site2 的 `precheck`、`reconcile`、`cleanup`
- 服务端只有一个轻量 FastAPI 应用，没有外部队列、专职 worker 或分布式调度
- 部分任务会运行较久，并且 `cleanup`、`backfill --formal` 这类操作具备明显破坏性
- 只要把“后台触发任务”做成同步 API，就会把请求处理、长任务执行、并发保护和失败恢复混在一起

因此，这个 change 需要先定义一个最小但靠谱的执行基础：请求如何入队、谁来执行、哪些任务允许执行、哪些参数必须被拒绝、冲突任务如何处理、后台如何看到最终结果。

## Goals / Non-Goals

**Goals:**
- 允许管理员从 `/admin/crawl` 请求受支持的手工任务执行，而不需要直接登录机器跑 shell
- 将手工执行改为异步模型：API 返回已受理的 run id，由后台轮询状态而不是长连接阻塞
- 对受支持任务执行白名单、参数校验和范围边界控制
- 为手工执行提供统一的生命周期状态、失败摘要、审计字段和并发保护
- 让手工执行与 CLI / 定时运行共享同一套 run record 语义，避免出现双轨状态

**Non-Goals:**
- 不开放 `cleanup`、`backfill --formal`、无界时间范围回补或任意 shell 命令执行
- 不在第一版做实时日志流、运行中取消、暂停/恢复或优先级调度
- 不引入外部消息队列、分布式 worker 或多节点协调
- 不把所有 site2 验证 flag 暴露到后台，例如会写库的 `--verify-recovery`、`--verify-boundary`

## Decisions

### 1. 使用 DB-backed run request + 本地 dispatcher，而不是同步 API 或外部队列
- **Decision:** 手工触发 API 只负责鉴权、校验参数并写入 `queued` 的 run request；本地 dispatcher 在后台轮询并认领请求，再执行对应任务。
- **Why:** 这最贴合现有 FastAPI + SQLite 结构，既避免同步请求长时间挂起，也不需要先引入外部队列系统。
- **Alternative considered:** 直接在 API 请求里同步执行。放弃，因为长任务会阻塞请求链路，也无法稳定处理失败与重试。
- **Alternative considered:** 先引入 Redis/Celery 等队列。放弃，因为这会把 follow-up 从控制面扩展成新的基础设施项目。

### 2. 受支持任务通过受控 subprocess adapter 执行，而不是在 server 进程内直接 import 调用
- **Decision:** dispatcher 通过受控的任务适配器启动 subprocess，执行白名单中的 crawler 命令，并把 stdout/stderr 写到受控日志路径，同时把摘要回填到 run record。
- **Why:** subprocess 隔离了长任务的崩溃风险，复用了现有 CLI 入口，也比在 server 进程里直接 import 调用更容易捕获退出码与日志。
- **Alternative considered:** 直接 import Python `run()` 函数。放弃，因为一旦任务异常、阻塞或污染进程状态，会直接拖累 API 进程。

### 3. 控制面采用显式 task registry，而不是接受任意模块名和参数
- **Decision:** 服务端维护一份 task registry，定义每个可触发 action 的 `site`、`taskName`、`runKind`、允许参数、参数 schema、最大窗口范围和对应 subprocess adapter。
- **Why:** 这避免后台演变成“远程执行任意 crawler 脚本”的入口，也让 UI 可以只渲染真正安全的操作项。
- **Alternative considered:** 让前端传模块名和参数字典。放弃，因为安全边界过于脆弱，也无法稳定校验。

### 4. 并发保护先按 site 级排他锁实现
- **Decision:** 第一版手工控制面对同一站点采用排他锁：同一时刻只允许一个写入型或诊断型 control-plane 任务处于 `running`，站点间可并行。
- **Why:** 当前站点级数据链路已经足够复杂，先把冲突面缩到最小更安全；这也能避免手工 backfill 与 incremental / recovery 互相踩踏。
- **Alternative considered:** 按 `site + taskName` 细粒度加锁。放弃，因为 `backfill`、`recovery`、`incremental` 之间仍可能互相干扰。

### 5. 第一版只开放安全白名单动作，并对 backfill 做硬边界约束
- **Decision:** 第一版允许 `incremental`、`recovery`、受限窗口 `backfill`，以及只读的 `precheck`、普通 `reconcile`；拒绝 `cleanup`、`backfill --formal` 和所有会隐式扩大范围的高级 flag。受限 `backfill` 必须满足配置化的最大窗口范围。
- **Why:** 一旦控制面能执行破坏性或无界任务，后台就会变成事故入口。先只开放可恢复、可审计、风险较小的动作更合理。
- **Alternative considered:** 完整暴露所有现有 CLI 能力。放弃，因为当前运维模型和权限边界都不足以承受。

### 6. 手工执行和既有运行历史共享同一套 run lifecycle 模型
- **Decision:** control-plane 产生的 `queued/running/succeeded/failed/rejected` 生命周期记录，和现有 CLI / 定时任务的 run snapshot 保持同源或可关联，确保 `/admin/crawl` 只需要消费一套运行历史。
- **Why:** 如果手工执行和例行执行各写一套表或各走一套字段，后台会迅速出现“双轨真相”。
- **Alternative considered:** 手工控制单独建一套 request 表，监控后台继续消费另一套 run history。放弃，因为状态难以对齐。

## Risks / Trade-offs

- [Risk] 本地 dispatcher 跟着 API 进程走，进程重启会打断运行中的任务
  Mitigation: 明确记录 `queued/running` 状态，启动时把孤儿 `running` 任务标记为失败，并在 UI 上展示“worker restarted”之类的失败原因
- [Risk] subprocess 模式只能自然拿到退出码和日志，难以直接拿到结构化统计
  Mitigation: 要求适配器把关键计数写回 run summary，必要时约定标准输出摘要格式
- [Risk] site 级锁较保守，可能拒绝一些理论上可并行的任务组合
  Mitigation: 第一版先偏安全，等真实冲突模式明确后再下探到 task 级或窗口级锁
- [Risk] bounded backfill 的安全上限设得过小会影响补救效率
  Mitigation: 上限做成配置项，并把“大范围回填”继续保留给 shell / 运维流程

## Migration Plan

1. 定义 run request / lifecycle / lock 的持久化模型，以及 task registry。
2. 为受支持任务实现 subprocess adapter 和参数校验器。
3. 在 server 侧增加 dispatcher、锁管理和 startup 恢复逻辑。
4. 在 `/api/admin/crawl/*` 增加手工触发与状态查询接口。
5. 在 `/admin/crawl` 增加 request form、状态轮询和拒绝原因展示。
6. 先以保守白名单上线，确认锁、失败恢复和审计信息工作正常后，再考虑扩展动作集。

回滚策略：如 control-plane 出现系统性异常，可立即关闭后台触发入口，仅保留只读监控；既有 crawler CLI 和定时任务不应依赖 control-plane 才能运行。

## Open Questions

- dispatcher 是内嵌在 API 进程里即可，还是要在后续拆成单独的本地 worker 进程？
- bounded backfill 的默认上限应该按“天数”还是按“窗口数”配置？
- 是否需要支持“取消 queued 但尚未开始的请求”，还是第一版全部采用显式拒绝 / 完成模型即可？
