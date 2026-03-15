## Why

当前 crawler 的真实运行模型仍然是“脚本入口 + 定时执行 + 日志 + `notices` 结果表”。仓库里还没有任务队列、job lock、run record 表或安全的后台触发模型。原 spec 把“监控”和“手工触发”绑在一起，会把一个本来可以快速落地的只读观测面，扩成新的执行基础设施改造。

更现实的第一版应该先回答这些问题：
- site1 / site2 最近一次例行采集是否成功
- 数据是不是已经陈旧、断流或明显不完整
- 最近跑过哪些 backfill / recovery / reconcile / cleanup
- 哪些问题属于“任务执行失败”，哪些属于“数据结果异常”

等这些信息在后台中可见之后，再单独 spec 手工触发和控制面。

## What Changes

- 新增只读的采集运维后台，聚合 site1 / site2 的例行采集健康度、最近运行结果和数据新鲜度。
- 为 site1 / site2 的现有任务入口补充结构化 run snapshot 记录，覆盖 `incremental`、`recovery`、`backfill`，以及 site2 的 `precheck`、`cleanup`、`reconcile` 等维护/诊断任务。
- 新增采集运行历史视图，支持按 site、task、run kind、status、trigger source 查看最近执行记录和摘要。
- 在后台中明确区分“例行采集管道”和“维护/诊断任务”，不把 `backfill` / `cleanup` / `reconcile` 与日常增量健康度混为一类。
- 将手工触发、参数化 backfill、cleanup 执行等控制面能力移出本 change，后续单独 spec。

## Capabilities

### New Capabilities
- `admin-crawl-run-monitoring`: 展示各站点例行采集管道的最近运行状态、结果摘要和数据新鲜度
- `admin-crawl-run-history`: 提供采集任务与维护/诊断任务的结构化运行历史查看能力

### Modified Capabilities

## Impact

- 管理端前端：需要在 [ui](/Users/zhangziming/opt/projects/zhaobiao/ui) 中新增专用的 `/admin/crawl/*` 只读运维页面
- 后端/API：需要新增只读的采集监控与运行历史查询接口，而不是任务触发接口
- crawler：需要在现有任务入口或包装层输出结构化运行快照，而不仅是控制台日志
- 数据存储：需要新增轻量的 crawl run snapshot 持久化结构，用于后台展示最近运行与历史记录
