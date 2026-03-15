"""
Site2 reconciliation: compare source totals vs database counts by date and notice type.

Usage:
    python -m crawler.site2.tasks.reconcile --start 2026-03-01 --end 2026-03-14
    python -m crawler.site2.tasks.reconcile --start 2026-03-01 --end 2026-03-14 --db notices.db
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler import storage
from crawler.site1.windowing import daily_windows, last_48h_windows
from crawler.site2 import config, client, session
from .core import run_window_series

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _db_count_for_window(conn, site: str, notice_type: str, start_time: str, end_time: str) -> int:
    """Count records in DB for the given window and notice type."""
    cur = conn.execute(
        """
        SELECT COUNT(*) FROM notices
        WHERE site = ? AND category_num = ?
        AND publish_time >= ? AND publish_time <= ?
        """,
        (site, notice_type, start_time, end_time),
    )
    return cur.fetchone()[0]


def reconcile_date_range(
    start_date: str,
    end_date: str,
    db_path: str = "notices.db",
) -> list[dict]:
    """
    Reconcile source vs DB for each date and notice type.
    Returns list of {date, notice_type, source_total, db_count, ok, gap}.
    """
    windows = daily_windows(start_date, end_date)
    results = []
    db_full = Path(db_path)
    if not db_full.is_absolute():
        db_full = Path(__file__).resolve().parents[3] / "data" / db_path
    conn = storage.get_connection(str(db_full))
    try:
        sess = session.create_session()
        for notice_type in config.NOTICE_TYPES:
            for start_time, end_time in windows:
                date_str = start_time[:10]
                source_total = client.probe_total(sess, notice_type, start_time, end_time)
                db_count = _db_count_for_window(
                    conn, config.SITE_ID, notice_type, start_time, end_time
                )
                ok = source_total == db_count
                gap = source_total - db_count
                results.append({
                    "date": date_str,
                    "notice_type": notice_type,
                    "source_total": source_total,
                    "db_count": db_count,
                    "ok": ok,
                    "gap": gap,
                })
                status = "OK" if ok else f"GAP {gap:+d}"
                logger.info(
                    f"[{notice_type}] {date_str}: source={source_total}, db={db_count} -> {status}"
                )
    finally:
        conn.close()
    return results


def verify_idempotent(
    start_time: str,
    end_time: str,
    notice_type: str = "59",
    db_path: str = "notices.db",
    runs: int = 3,
) -> dict:
    """
    Run the same window multiple times, verify no duplicate (site,id) and count stable.
    Returns {passed: bool, initial_count, final_count, duplicate_count, message}.
    """
    db_full = Path(db_path)
    if not db_full.is_absolute():
        db_full = Path(__file__).resolve().parents[3] / "data" / db_path
    conn = storage.get_connection(str(db_full))

    def count_and_dupes():
        cur = conn.execute(
            """
            SELECT COUNT(*), COUNT(*) - COUNT(DISTINCT id) as dupes
            FROM notices WHERE site = ? AND category_num = ?
            AND publish_time >= ? AND publish_time <= ?
            """,
            (config.SITE_ID, notice_type, start_time, end_time),
        )
        row = cur.fetchone()
        return row[0], row[1] or 0

    try:
        initial_count, initial_dupes = count_and_dupes()
        for i in range(runs - 1):
            run_window_series(
                [(start_time, end_time)],
                [notice_type],
                str(db_full),
            )
        final_count, final_dupes = count_and_dupes()
        passed = (
            final_dupes == 0
            and (final_count <= initial_count + 10)  # allow small source growth
        )
        return {
            "passed": passed,
            "initial_count": initial_count,
            "final_count": final_count,
            "duplicate_count": final_dupes,
            "message": "OK" if passed else f"dupes={final_dupes} or count grew unexpectedly",
        }
    finally:
        conn.close()


def verify_boundary_convergence(
    date_str: str,
    db_path: str = "notices.db",
) -> dict:
    """
    Verify full-day window capture is consistent: run the day window, then reconcile.
    Overlap incremental + full-day should converge via (site,id) upsert.
    """
    day_start = f"{date_str} 00:00:00"
    day_end = f"{date_str} 23:59:59"
    db_full = Path(db_path)
    if not db_full.is_absolute():
        db_full = Path(__file__).resolve().parents[3] / "data" / db_path
    run_window_series([(day_start, day_end)], list(config.NOTICE_TYPES.keys()), str(db_full))
    results = reconcile_date_range(date_str, date_str, db_path)
    failed = [r for r in results if not r["ok"]]
    return {
        "passed": len(failed) == 0,
        "gaps": len(failed),
        "message": "OK" if not failed else f"{len(failed)} type(s) have gaps",
    }


def verify_failure_recovery(
    db_path: str = "notices.db",
) -> dict:
    """
    Verify recovery can fill gaps: run recovery for last 48h, report any remaining gaps.
    """
    from datetime import datetime, timedelta
    now = datetime.now()
    windows = last_48h_windows(now)
    if not windows:
        return {"passed": True, "message": "No windows to verify"}
    start_date = windows[0][0][:10]
    end_date = windows[-1][1][:10]
    run_window_series(windows, list(config.NOTICE_TYPES.keys()), db_path)
    results = reconcile_date_range(start_date, end_date, db_path)
    failed = [r for r in results if not r["ok"]]
    return {
        "passed": len(failed) == 0,
        "gaps_after_recovery": len(failed),
        "message": "OK" if not failed else f"{len(failed)} gaps remain",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Site2 source-vs-db reconciliation")
    parser.add_argument("--start", help="Start date, e.g. 2026-03-01 (required for reconcile, omit for --verify-recovery/--verify-boundary)")
    parser.add_argument("--end", help="End date inclusive (required for reconcile)")
    parser.add_argument("--db", default="notices.db", help="SQLite DB path")
    parser.add_argument("--verify-idempotent", action="store_true", help="Run idempotency check on first window")
    parser.add_argument("--verify-boundary", metavar="DATE", help="Verify overlap vs full-day convergence for DATE")
    parser.add_argument("--verify-recovery", action="store_true", help="Run recovery and verify gaps filled")
    args = parser.parse_args()

    if args.verify_recovery:
        v = verify_failure_recovery(args.db)
        logger.info(f"Recovery verification: {v['message']}")
        sys.exit(0 if v["passed"] else 1)

    if args.verify_boundary:
        v = verify_boundary_convergence(args.verify_boundary, args.db)
        logger.info(f"Boundary verification: {v['message']}")
        sys.exit(0 if v["passed"] else 1)

    if not args.start or not args.end:
        parser.error("--start and --end are required for reconciliation (omit for --verify-recovery or --verify-boundary only)")

    results = reconcile_date_range(args.start, args.end, args.db)
    failed = [r for r in results if not r["ok"]]
    if failed:
        logger.warning(f"Reconciliation: {len(failed)} gaps in {len(results)} checks")
    else:
        logger.info(f"Reconciliation: all {len(results)} checks OK")

    if args.verify_idempotent and results:
        r0 = results[0]
        start_t, end_t = f"{r0['date']} 00:00:00", f"{r0['date']} 23:59:59"
        v = verify_idempotent(start_t, end_t, r0["notice_type"], args.db)
        logger.info(f"Idempotency: {v['message']}")


if __name__ == "__main__":
    main()
