## Context

当前仓库已经有两类与采集运维相关的真实资产：

1. **可执行任务入口**
   - site1: `backfill`、`incremental`、`recovery`
   - site2: `backfill`、`incremental`、`recovery`，以及 `precheck`、`cleanup`、`reconcile`

2. **可观测数据源**
   - 控制台日志：能看到分页、重试、错误，但难以聚合
   - `notices` 表：能推导 freshness、日量级、字段完整性等“结果健康度”

但仓库里**还没有**这些能力：
- 任务运行记录表
- 任务队列或后台 worker
- 安全的任务触发 API
- 并发保护与 job lock
- 已抽象好的 admin 控制台壳层

因此第一版更合理的目标不是“后台直接控制 crawler”，而是先把当前真实运行状态和数据健康度结构化、可视化。

## Goals / Non-Goals

**Goals:**
- 提供一个最小可用的只读采集运维后台，展示 site1 / site2 的例行采集健康度
- 提供结构化运行历史，覆盖 routine / maintenance / diagnostic 三类任务
- 让 crawler 运行结果从“日志”升级为“结构化 run snapshot + 数据结果信号”
- 在后台中明确区分“执行状态”和“数据状态”

**Non-Goals:**
- 不在这个 change 中提供手工触发、参数化 backfill 或 cleanup 执行能力
- 不构建任务队列、分布式调度、可视化 DAG 或 cron 编辑器
- 不做实时日志流、任务取消、抢占执行或多节点并发协调
- 不把企业审核管理混进这个 change

## Decisions

### 1. 继续复用 `ui/`，但把 admin layout 视为本 change 的一部分
- **Decision:** 采集运维后台继续放在 `ui/` 的 `/admin/*` 路由族内，但不再假设“现成的 admin 壳层已经存在”；需要在本 change 中补一个最小 admin layout / navigation。
- **Why:** 现在仓库确实已经有 `/admin/reviews`、`/admin/companies` 页面，但它们是独立页面，不是成熟的共享后台壳层。
- **Alternative considered:** 新建独立 crawler dashboard 工程。放弃，因为第一版仍更适合内聚在现有 `ui/` 工程里。

### 2. 用 run snapshot 记录真实执行结果，而不是解析日志
- **Decision:** 为现有任务入口补充轻量 run snapshot 持久化，至少记录 `site`、`taskName`、`runKind`、`triggerSource`、`status`、`startedAt`、`finishedAt`、`fetched`、`upserted`、`errorCount`、`summary`、`payload`。
- **Why:** 直接解析日志既脆弱又难筛选；而现有任务已经有明确入口，最适合在入口/包装层记录开始、成功、失败三类快照。
- **Alternative considered:** 继续只看日志文件。放弃，因为无法支撑后台列表、筛选与趋势展示。

### 3. 后台健康度同时看“运行快照”和“结果数据”
- **Decision:** `/admin/crawl` 的健康度不只看最近一次任务有没有成功退出，还要结合 `notices` 表推导 freshness、最近写入时间、基础量级和可用的 gap 信号。
- **Why:** “任务退出成功”不等于“数据健康”。例如某次 run 成功结束，但站点已经断流、结果仍陈旧，后台应该把这两件事分开显示。
- **Alternative considered:** 仅展示 run status。放弃，因为会误导运营把“无异常退出”当成“数据正常”。

### 4. 显式区分例行采集与维护/诊断任务
- **Decision:** 在数据模型和 UI 中将任务分为 `routine`、`maintenance`、`diagnostic`。`incremental` / `recovery` 属于例行健康度主视图；`backfill`、`cleanup`、`precheck`、`reconcile` 进入历史与详情视图。
- **Why:** 这些任务的风险、频率和运营语义完全不同，把它们并列展示会让后台失真。
- **Alternative considered:** 把所有 task 视为同一种 crawl job。放弃，因为这不符合现有 site2 runbook 和任务职责。

### 5. 手工触发延后到单独 change
- **Decision:** 本 change 明确只做只读观测面；任何“后台点击后执行任务”的能力另开 follow-up change，再讨论执行模型、并发保护、日志流和安全边界。
- **Why:** 当前代码里没有 job queue、process manager 或 lock 机制，直接把触发能力塞进后台会把范围从“可见性”升级成“执行基础设施”。
- **Alternative considered:** 先做单机内同步触发 API。放弃，因为长任务会阻塞请求链路，也没有稳定的失败恢复和并发防护。

## Risks / Trade-offs

- [Risk] 部分任务若绕过标准入口执行，可能不会留下 run snapshot
  Mitigation: 统一任务入口/包装层，并把“后台可见”的支持入口写入运行说明
- [Risk] `notices` 推导出的 freshness 只能表示结果信号，不能替代全量对账
  Mitigation: 在 UI 上分开呈现“执行状态”和“数据状态”，必要时补充 reconcile 摘要
- [Risk] site1 与 site2 的任务集并不对称，容易把模型做得过死
  Mitigation: 采用 task catalog / run kind 模型，而不是假设所有站点拥有相同按钮和诊断能力
- [Risk] admin layout 新增后会让现有 `/admin/*` 页面结构调整
  Mitigation: 通过独立 `/admin/crawl/*` 路由和模块导航渐进接入，不强迫一次性重做所有后台页面

## Migration Plan

1. 先定义 run snapshot 数据模型、task catalog 和 freshness 规则。
2. 在 site1 / site2 现有任务入口或公共包装层中写入开始/成功/失败快照。
3. 新增只读 admin API，输出 overview、history 和必要的诊断摘要。
4. 在 `ui/` 中补 `/admin/crawl` 监控页与运行历史页，并引入最小 admin layout。
5. 对照当前日志、`notices` 数据和 site2 runbook 验证后台展示是否可信。
6. 将手工触发 / 控制面能力记录为 follow-up change，而不是在本 change 内实现。

## Open Questions

- 运行历史详情里是否需要展示最近日志摘录，还是只展示结构化 summary 即可？
- site2 `reconcile` 的结果是直接作为一次 diagnostic run 的 payload 保存，还是再抽一层 gap summary 供 overview 直接消费？
- site1 的 overview 是按站点聚合即可，还是要继续细到 category 维度？
