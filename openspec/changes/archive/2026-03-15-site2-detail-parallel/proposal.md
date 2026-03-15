## Why

当前 site2 爬虫对每页的 detail 请求是串行执行的，125 条记录需 125 次顺序请求，单页耗时约 30-40 秒。青果代理 IP 有效期为 50 秒，单 IP 内只能完成约 1-2 页，导致 IP 消耗高、全量 backfill 耗时长。将同一页的 detail 请求改为并行抓取，可在不增加 IP 消耗的前提下显著提升单 IP 产出，缩短总时间。

## What Changes

- 在 `process_window` 中，对同一页的 rows 使用 `ThreadPoolExecutor`（默认 5 workers）并行调用 `fetch_detail`
- 新增配置项 `DETAIL_PARALLEL_WORKERS`（默认 5），可调
- 保持现有重试逻辑：并行批次中失败的记录，在批次结束后按原逻辑串行重试（代理错误换 session，超时保持 session）
- 保持 `ensure_fresh` 在每批并行前调用，确保 session 有效

## Capabilities

### New Capabilities
- 无

### Modified Capabilities
- `site2-crawler`: 详情抓取由串行改为可配置 worker 数的并行执行

## Impact

- `crawler/site2/config.py` — 新增 `DETAIL_PARALLEL_WORKERS`
- `crawler/site2/tasks/core.py` — `process_window` 中 detail 循环改为 `ThreadPoolExecutor.map` 或等价并行逻辑
- 预计：每 IP 产出从 ~150 条提升至 ~550 条，总 IP 消耗从 ~25 降至 ~12，全量 backfill 时间从 ~25min 降至 ~12min
