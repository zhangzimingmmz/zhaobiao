## ADDED Requirements

### Requirement: 爬虫可并行抓取详情
系统 SHALL 在 `process_window` 中对同一页的 detail 请求使用可配置数量的 worker 并行执行。配置项 `DETAIL_PARALLEL_WORKERS`（默认 5）SHALL 存放在 `config.py`。并行 batch 中失败的记录 SHALL 按现有逻辑串行重试（代理错误换 session，超时保持 session）。

#### Scenario: 同一页多条详情并行抓取
- **WHEN** 某页有 10 条 rows 待抓取 detail
- **THEN** 系统 SHALL 使用最多 `DETAIL_PARALLEL_WORKERS` 个并发请求并行执行
- **AND** 总耗时 SHALL 显著低于串行执行（约 1/worker 数）

#### Scenario: 并行失败的记录串行重试
- **WHEN** 并行 batch 中某条 fetch_detail 返回空或抛出传输异常
- **THEN** 该条 SHALL 进入串行重试流程，逻辑与当前一致（代理错误换 session，超时保持 session）

#### Scenario: Worker 数可配置
- **WHEN** 修改 `config.DETAIL_PARALLEL_WORKERS` 为 3
- **THEN** 并行抓取 SHALL 使用最多 3 个 worker
