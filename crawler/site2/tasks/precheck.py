"""
Site2 pre-check before formal initialization.

Reports: old test data distribution, expected backfill range, target notice types.

Usage:
    python -m crawler.site2.tasks.precheck
    python -m crawler.site2.tasks.precheck --db notices.db
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler import storage
from crawler.site2 import config
from .cleanup import run as run_cleanup_dry

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

FORMAL_START = "2026-03-01"


def run(db_path: str = "notices.db") -> bool:
    """
    Pre-check before formal init. Returns True if ready.
    """
    db_full = Path(db_path)
    if not db_full.is_absolute():
        db_full = Path(__file__).resolve().parents[3] / "data" / db_path
    conn = storage.get_connection(str(db_full))
    try:
        # 1. Old test data distribution
        cur = conn.execute(
            """
            SELECT category_num, COUNT(*) as cnt
            FROM notices WHERE site = ?
            GROUP BY category_num
            """,
            (config.SITE_ID,),
        )
        rows = cur.fetchall()
        total = sum(r["cnt"] for r in rows)
        logger.info(f"=== Site2 pre-check ===")
        logger.info(f"Old test data: {total} records for site={config.SITE_ID}")
        for r in rows:
            logger.info(f"  - {r['category_num'] or 'NULL'}: {r['cnt']}")

        # 2. Expected backfill range
        end_date = datetime.now().strftime("%Y-%m-%d")
        logger.info(f"Expected backfill range: {FORMAL_START} ~ {end_date}")

        # 3. Target notice types
        logger.info(f"Target notice types: {list(config.NOTICE_TYPES.keys())} ({config.NOTICE_TYPES})")

        # 4. Dry-run cleanup count
        n = run_cleanup_dry(db_path, dry_run=True)
        logger.info(f"Cleanup would remove: {n} records")
        return True
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Site2 pre-check before formal init")
    parser.add_argument("--db", default="notices.db", help="SQLite DB path")
    args = parser.parse_args()
    run(args.db)


if __name__ == "__main__":
    main()
