## Why

只读的采集监控后台能让运营“看见问题”，但还不能安全地“处理问题”。现在任何重跑、回补或诊断都要靠 shell 进入机器执行脚本，这既缺少审计，也没有参数校验、并发保护和统一的运行状态机，容易把一次补救操作变成新的事故。

因此 manual trigger / control-plane 必须作为独立 change 处理：它本质上是在引入一套受控执行模型，而不是给后台多加几个按钮。

## What Changes

- 新增采集控制面能力，允许管理员从 `/admin/crawl` 请求受支持的手工任务执行，并查看其排队、运行、完成或拒绝状态。
- 新增服务端执行模型，支持异步接收 run request、持久化生命周期状态、参数校验、并发保护和执行摘要记录。
- 在第一版中仅开放受支持的低风险或受边界约束的任务类型，如 `incremental`、`recovery`、受限窗口的 `backfill`，以及只读诊断任务（如 `precheck`、`reconcile`）。
- 将 `cleanup`、`backfill --formal`、无界时间范围回补、实时日志流、任务取消和多节点分布式调度明确排除在本 change 外。
- 让后台手工触发与 CLI / 定时任务共享同一套 run record 和状态机，避免“后台一套、脚本一套”。

## Capabilities

### New Capabilities
- `admin-crawl-run-control`: 管理员提交受支持的手工 crawl 任务请求、查看请求状态和拒绝原因
- `crawl-run-execution`: 服务端异步执行受支持 crawl 任务，提供参数校验、状态流转、并发保护和运行审计

### Modified Capabilities

## Impact

- 管理端前端：`/admin/crawl` 需要从只读监控扩展为可发起受控操作的后台界面
- 后端/API：需要新增 run request / control-plane API、运行状态查询和参数校验
- crawler：需要统一受支持任务的调用入口，使服务端可以受控触发而不是仅依赖手工 CLI
- 数据存储：需要新增或扩展 run request / run lock / run lifecycle 持久化结构
- 运维边界：需要明确哪些任务可从后台触发、哪些仍然只能走 shell / 运维流程
