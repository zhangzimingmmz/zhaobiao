# Site2 正式运行说明

## 环境要求

验证与正式运行需满足：

- **代理**：`crawler/site2/config.py` 中 `PROXY_EXTRACT_URL` 可访问，或配置静态 `PROXIES`
- **网络**：可访问 `www.ccgp-sichuan.gov.cn`
- **验证码服务**：ddddocr 可正常识别验证码
- **Shell**：使用 `$(date +%Y-%m-%d)` 时需 bash 或兼容 shell

## 操作顺序

### 1. 正式初始化（首次或重建基线）

```bash
# 清理历史测试数据 + 回填 2026-03-01 至当前
python -m crawler.site2.tasks.backfill --formal

# 若已手动清理，可跳过 cleanup
python -m crawler.site2.tasks.backfill --formal --skip-cleanup
```

### 2. 预检查（可选，正式初始化前）

```bash
# 查看旧测试数据分布、预期回填范围、目标 notice type
python -m crawler.site2.tasks.precheck

# 或单独查看待清理数量
python -m crawler.site2.tasks.cleanup --dry-run

# 对账：确认当前数据与源站差异
python -m crawler.site2.tasks.reconcile --start 2026-03-01 --end $(date +%Y-%m-%d)
```

### 3. 增量运行（每 2 小时）

```bash
python -m crawler.site2.tasks.incremental
# 或指定 DB: python -m crawler.site2.tasks.incremental --db notices.db
```

建议 crontab：`0 */2 * * * cd /path/to/project && python3 -m crawler.site2.tasks.incremental`

### 4. Recovery（每日或按需）

```bash
python -m crawler.site2.tasks.recovery
```

建议 crontab：`0 6 * * * cd /path/to/project && python3 -m crawler.site2.tasks.recovery`

### 5. 对账

```bash
# 按日期、类型输出 source vs db
python -m crawler.site2.tasks.reconcile --start 2026-03-01 --end 2026-03-15

# 幂等验证
python -m crawler.site2.tasks.reconcile --start 2026-03-14 --end 2026-03-14 --verify-idempotent

# 故障恢复验证
python -m crawler.site2.tasks.reconcile --verify-recovery
```

### 6. 重跑

同一窗口可重复执行，通过 `(site, id)` upsert 收敛为单条记录，不会产生重复：

```bash
# 重跑指定日期
python -m crawler.site2.tasks.backfill --start 2026-03-14 --end 2026-03-14
```

## 目标 notice type

- `59`：采购意向
- `00101`：采购公告

## 数据路径

默认 `data/notices.db`，可通过 `--db` 指定。

## 一键验证脚本

从项目根目录执行，自动跑完 Phase 0～5：

```bash
./scripts/verify_site2.sh
```

---

## 验收检查清单（真实网络环境）

在真实网络下完整验证时，按以下顺序执行并检查日志与数据。

### Phase 0：准备

```bash
mkdir -p logs
cp data/notices.db data/notices.db.bak   # 可选，--formal 会清空 site2 数据
```

### Phase 1：预检查（只读）

```bash
python3 -m crawler.site2.tasks.precheck 2>&1 | tee logs/01_precheck.log
python3 -m crawler.site2.tasks.cleanup --dry-run 2>&1 | tee logs/02_cleanup_dryrun.log
python3 -m crawler.site2.tasks.reconcile --start 2026-03-01 --end $(date +%Y-%m-%d) 2>&1 | tee logs/03_reconcile_before.log
```

### Phase 2：正式初始化（耗时 30min～2h）

```bash
python3 -m crawler.site2.tasks.backfill --formal 2>&1 | tee logs/04_backfill_formal.log
```

检查：`Deleted X records`、`source_total`、`Page N: fetched=..., upserted=...`、`backfill complete`

### Phase 3：增量与 Recovery

```bash
python3 -m crawler.site2.tasks.incremental 2>&1 | tee logs/05_incremental.log
python3 -m crawler.site2.tasks.recovery 2>&1 | tee logs/06_recovery.log
```

### Phase 4：对账与验证

```bash
python3 -m crawler.site2.tasks.reconcile --start 2026-03-01 --end $(date +%Y-%m-%d) 2>&1 | tee logs/07_reconcile_after.log
python3 -m crawler.site2.tasks.reconcile --start 2026-03-14 --end 2026-03-14 --verify-idempotent 2>&1 | tee logs/08_verify_idempotent.log
python3 -m crawler.site2.tasks.reconcile --verify-boundary 2026-03-14 2>&1 | tee logs/09_verify_boundary.log
python3 -m crawler.site2.tasks.reconcile --verify-recovery 2>&1 | tee logs/10_verify_recovery.log
```

检查：`-> OK`、`Idempotency: OK`、`Boundary verification: OK`、`Recovery verification: OK`

### Phase 5：数据检查

```bash
# 按类型统计
sqlite3 data/notices.db "SELECT category_num, COUNT(*) FROM notices WHERE site='site2_ccgp_sichuan' GROUP BY category_num;"

# 重复检查（期望无输出）
sqlite3 data/notices.db "SELECT site, id, COUNT(*) FROM notices WHERE site='site2_ccgp_sichuan' GROUP BY site, id HAVING COUNT(*) > 1;"
```

### 验收通过标准

| 检查项 | 通过标准 |
|--------|----------|
| 预检查 | 输出旧数据分布、回填范围、notice type |
| 正式初始化 | 无异常退出，errors 可接受 |
| 增量 / Recovery | 无异常退出，有 fetched/upserted |
| 对账 | 多数日期/类型 OK，GAP 可接受 |
| 幂等验证 | `Idempotency: OK`，dupes=0 |
| 边界 / 故障恢复验证 | 输出 OK，exit 0 |
| 数据 | 无重复 (site, id)，category_num 分布合理 |
