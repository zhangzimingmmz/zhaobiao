## 1. 配置

- [x] 1.1 在 `crawler/site2/config.py` 中新增 `DETAIL_PARALLEL_WORKERS = 5`

## 2. 并行 detail 逻辑

- [x] 2.1 在 `process_window` 中，将 `for row in rows` 的 detail 循环改为：先 `sess = session.ensure_fresh(sess)`，再用 `ThreadPoolExecutor(max_workers=config.DETAIL_PARALLEL_WORKERS)` 对 rows 并行调用 `fetch_detail`
- [x] 2.2 使用 `executor.map` 或 `submit`+`as_completed` 收集 `(row, detail)` 结果，保持与 rows 顺序一致
- [x] 2.3 对 detail 为空的记录，按现有逻辑串行重试（最多 MAX_RETRIES，代理错误换 session，超时保持 session）
- [x] 2.4 保持 `records_to_upsert` 构建与 `storage.upsert_records` 调用不变

## 3. 验证

- [x] 3.1 跑单日 backfill，对比并行前后耗时与 IP 消耗
