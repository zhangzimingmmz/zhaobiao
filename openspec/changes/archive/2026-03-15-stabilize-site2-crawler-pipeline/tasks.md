## 1. Shared Task Core

- [x] 1.1 Refactor `crawler/site2/tasks/` so `backfill`、`incremental`、`recovery` 共享同一套窗口执行与落库内核
- [x] 1.2 修正 `incremental` 和 `recovery` 的调用签名与数据库连接管理，确保三类入口都可独立运行
- [x] 1.3 统一 site2 任务日志输出，记录窗口范围、notice type、分页进度、重试和落库数量

## 2. Idempotent Collection and Retry Behavior

- [x] 2.1 校正 site2 列表/详情抓取流程，确保重复执行同一窗口时只通过 `(site, id)` upsert 收敛为单条记录
- [x] 2.2 改进列表空返回、代理失效、验证码失败和详情失败时的重试/会话重建策略，避免误判为“无数据”提前结束
- [x] 2.3 确保后续运行可以补全先前不完整记录的 `category_num`、`raw_json`、`purchaser`、`agency`、`content` 等字段

## 3. Formal Initialization and Scheduled Windows

- [x] 3.1 实现 site2 历史测试数据清理流程，仅清理 `site='site2_ccgp_sichuan'` 的旧测试记录
- [x] 3.2 实现正式初始化 backfill：从 `2026-03-01` 到当前时间覆盖 `59` 和 `00101`
- [x] 3.3 实现带安全重叠窗口的每 2 小时 incremental 运行策略
- [x] 3.4 实现最近 48 小时 recovery 运行策略，覆盖两类 notice type

## 4. Reconciliation and Stability Verification

- [x] 4.1 增加按日期、按类型的 source-vs-db 对账输出，比较 `probe_total` 与数据库计数
- [x] 4.2 增加幂等验证步骤：同一窗口重复执行多次后，确认总数不增长且无重复 `(site, id)`
- [x] 4.3 增加边界窗口验证步骤：确认重叠增量与整日抓取的记录集合可以收敛一致
- [x] 4.4 增加故障恢复验证步骤：模拟/接受单次失败后，通过 recovery 或重跑补齐差额

## 5. Operational Readiness

- [x] 5.1 编写 site2 正式运行说明，明确初始化、增量、recovery、对账和重跑的操作顺序
- [x] 5.2 执行正式初始化前的预检查，确认旧测试数据分布、预期回填范围和目标 notice type
- [x] 5.3 完成正式初始化与首轮对账，确认 site2 基线数据可作为后续增量起点

## 6. Acceptance Verification（真实网络环境验收）

在真实网络环境下完整跑一遍，检查数据和日志：

- [x] 6.1 Phase 0：备份 `data/notices.db`，创建 `logs/` 目录
- [x] 6.2 Phase 1 预检查：执行 `precheck`、`cleanup --dry-run`、`reconcile --start 2026-03-01 --end $(date +%Y-%m-%d)`，确认输出正常
- [x] 6.3 Phase 2 正式初始化：执行 `backfill --formal`，检查日志无异常退出、errors 可接受
- [x] 6.4 Phase 3 增量与 Recovery：执行 `incremental`、`recovery`，检查日志有 fetched/upserted
- [x] 6.5 Phase 4 对账与验证：执行 `reconcile`、`--verify-idempotent`、`--verify-boundary`、`--verify-recovery`，确认 OK
- [x] 6.6 Phase 5 数据检查：`sqlite3` 查询无重复 `(site, id)`，`category_num` 分布合理

## 7. Verification Tooling（验证工具修复）

- [x] 7.1 修正 reconcile：`--verify-recovery` 和 `--verify-boundary` 无需 `--start`/`--end`
- [x] 7.2 修正 test_site2.py：使用 `run` 而非 `run_backfill`
- [x] 7.3 新增 `scripts/verify_site2.sh` 一键验证脚本
- [x] 7.4 在 RUNBOOK 中补充环境要求说明

## 8. Proxy Session Optimization（代理会话优化，减少 IP 消耗与提升稳定性）

根因：青果短效代理 IP 有效期为 60 秒，当前代码被动等代理过期出错后再换 session，导致大量 ProxyError、浪费约 43% 的 probe session、28% 的错误恢复 session。

- [x] 8.1 主动轮换：在 `session.py` 中为 session 添加 `created_at` 时间戳，在 `core.py` 中实现 `ensure_fresh(sess)`，在每次 list/detail 请求前检查，若 `now - created_at > SESSION_TTL`（建议 50s）则主动换 session，消除 100% 代理过期错误
- [x] 8.2 复用 probe session：在 `process_window` 中，用同一 session 执行 probe 与 data 抓取，不再为 probe 单独创建并丢弃 session，节省约 26 个 IP（43%）
- [x] 8.3 跨 window 复用 session：在 `run_window_series` 中，将仍有有效期的 session 传递给下一个 window 继续使用，避免小 window 结束后丢弃未过期 session
- [x] 8.4（可选）Detail 并行：在 `process_window` 中，对同一页的 detail 请求使用 `ThreadPoolExecutor` 并行抓取；并发度由 `DETAIL_PARALLEL_WORKERS` 配置控制，真实网络环境已为稳定性调优到 `3` workers
