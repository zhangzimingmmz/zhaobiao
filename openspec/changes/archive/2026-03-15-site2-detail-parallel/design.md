## Context

当前 `process_window` 对每页 rows 的 detail 抓取是串行的：`for row in rows: detail = fetch_detail(...)`。每页 10 条 × 0.3s ≈ 3s，125 条需 13 页 × 3s ≈ 40s。单 IP 有效期内（50s）仅能完成约 1-2 页，导致 IP 消耗高。8.1-8.3 已实现主动轮换、probe 复用、跨 window 复用，8.4 通过并行化 detail 进一步提升单 IP 吞吐。

## Goals / Non-Goals

**Goals:**
- 同一页的 detail 请求并行执行，默认 5 个 worker
- 保持现有重试与错误分类逻辑（代理错误换 session，超时保持 session）
- 可配置 worker 数，便于调优
- 预计每 IP 产出提升约 3-4 倍

**Non-Goals:**
- 不增加新 IP 消耗（仍用同一 session 的同一代理）
- 不修改 list 的 pageSize（可后续单独优化）
- 不引入进程级并行（仅线程级）

## Decisions

### D1: ThreadPoolExecutor + 共享 Session

使用 `concurrent.futures.ThreadPoolExecutor(max_workers=DETAIL_PARALLEL_WORKERS)`，每个 worker 调用 `fetch_detail(sess, notice_type, row)`。同一 batch 内共享同一个 `sess`。

**理由**：`requests.Session` 的底层 `urllib3.HTTPConnectionPool` 对 GET 请求是线程安全的；我们仅做读操作，不修改 session 状态。实测多线程并发 GET 可行。

**备选**：每 worker 独立 session → 每 batch 消耗 N 个 IP，不可接受。

### D2: 批次前 ensure_fresh，批次内不换 session

在提交整页 rows 到 executor 之前调用一次 `sess = session.ensure_fresh(sess)`，batch 内所有 worker 共用该 session。batch 内不调用 `create_session()`。

**理由**：若 batch 中某请求触发代理错误，换 session 会影响其他进行中的请求，逻辑复杂。采用「先并行跑完，失败者后续串行重试」的策略更简单。

### D3: 失败记录串行重试

并行 batch 返回后，收集 `detail` 为空的 row，按现有逻辑串行重试（最多 MAX_RETRIES，代理错误换 session，超时保持 session）。

**理由**：与当前重试行为一致，避免在并行逻辑中嵌入复杂重试。

### D4: 使用 executor.map 保持顺序

`executor.map(fn, rows)` 返回的结果顺序与 rows 一致，便于按 `(row, detail)` 一一对应构建 `records_to_upsert`。

**实现**：定义 `_fetch_one(sess, notice_type, row) -> (row, detail)`，`map` 后直接 zip 到 rows。

## Risks / Trade-offs

- **[Session 线程安全]** → urllib3 连接池对 GET 线程安全；若遇异常再考虑加锁或每 worker 独立 session 的降级方案
- **[目标站限流]** → 5 并发若触发限流，可调低 `DETAIL_PARALLEL_WORKERS` 至 3
- **[单条超时拖慢整批]** → 某条 30s 超时会阻塞该 worker，但其他 4 个继续，影响有限
