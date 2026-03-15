"""
Site2 test data cleanup (before formal initialization)

Removes historical test records for site='site2_ccgp_sichuan' only.
Run this before formal backfill to ensure a clean baseline.

Usage:
    python -m crawler.site2.tasks.cleanup
    python -m crawler.site2.tasks.cleanup --db data/notices.db --dry-run
"""
from __future__ import annotations

import argparse
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler import storage
from crawler.site2 import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

def run(db_path: str = "notices.db", dry_run: bool = False) -> int:
    """
    Delete all notices where site=site2_ccgp_sichuan.
    Returns the number of rows deleted (or that would be deleted if dry_run).
    """
    db = Path(db_path)
    if not db.is_absolute():
        db = Path(__file__).resolve().parents[3] / "data" / db_path
    conn = storage.get_connection(str(db))
    try:
        cur = conn.execute(
            "SELECT COUNT(*) FROM notices WHERE site = ?",
            (config.SITE_ID,),
        )
        count = cur.fetchone()[0]
        logger.info(f"Found {count} records for site={config.SITE_ID}")
        if count == 0:
            return 0
        if dry_run:
            logger.info(f"[DRY-RUN] Would delete {count} records")
            return count
        conn.execute("DELETE FROM notices WHERE site = ?", (config.SITE_ID,))
        conn.commit()
        logger.info(f"Deleted {count} records for site={config.SITE_ID}")
        return count
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Clean site2 test data (site2_ccgp_sichuan only) before formal backfill"
    )
    parser.add_argument("--db", default="notices.db", help="SQLite DB path (relative to data/)")
    parser.add_argument("--dry-run", action="store_true", help="Show count only, do not delete")
    args = parser.parse_args()
    run(args.db, args.dry_run)


if __name__ == "__main__":
    main()
