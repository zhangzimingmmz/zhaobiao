#!/usr/bin/env bash
# Site2 完整验证脚本：在真实网络环境下执行 Phase 0～5
# 用法：从项目根目录执行 ./scripts/verify_site2.sh
# 需要：bash、代理可用、验证码服务正常

set -e
cd "$(dirname "$0")/.."
TODAY=$(date +%Y-%m-%d)
mkdir -p logs

echo "=== Phase 0: 准备 ==="
[ -f data/notices.db ] && cp data/notices.db data/notices.db.bak || true

echo "=== Phase 1: 预检查 ==="
python3 -m crawler.site2.tasks.precheck 2>&1 | tee logs/01_precheck.log
python3 -m crawler.site2.tasks.cleanup --dry-run 2>&1 | tee logs/02_cleanup_dryrun.log
python3 -m crawler.site2.tasks.reconcile --start 2026-03-01 --end "$TODAY" 2>&1 | tee logs/03_reconcile_before.log

echo "=== Phase 2: 正式初始化（耗时较长）==="
python3 -m crawler.site2.tasks.backfill --formal 2>&1 | tee logs/04_backfill_formal.log

echo "=== Phase 3: 增量与 Recovery ==="
python3 -m crawler.site2.tasks.incremental 2>&1 | tee logs/05_incremental.log
python3 -m crawler.site2.tasks.recovery 2>&1 | tee logs/06_recovery.log

echo "=== Phase 4: 对账与验证 ==="
python3 -m crawler.site2.tasks.reconcile --start 2026-03-01 --end "$TODAY" 2>&1 | tee logs/07_reconcile_after.log
python3 -m crawler.site2.tasks.reconcile --start 2026-03-14 --end 2026-03-14 --verify-idempotent 2>&1 | tee logs/08_verify_idempotent.log
python3 -m crawler.site2.tasks.reconcile --verify-boundary 2026-03-14 2>&1 | tee logs/09_verify_boundary.log
python3 -m crawler.site2.tasks.reconcile --verify-recovery 2>&1 | tee logs/10_verify_recovery.log

echo "=== Phase 5: 数据检查 ==="
sqlite3 data/notices.db "SELECT category_num, COUNT(*) FROM notices WHERE site='site2_ccgp_sichuan' GROUP BY category_num;"
echo "重复检查（期望无输出）:"
sqlite3 data/notices.db "SELECT site, id, COUNT(*) FROM notices WHERE site='site2_ccgp_sichuan' GROUP BY site, id HAVING COUNT(*) > 1;" || true

echo "=== 验证完成 ==="
