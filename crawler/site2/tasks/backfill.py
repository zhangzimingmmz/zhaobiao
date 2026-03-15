"""
Site2 backfill task (initialization)

Usage:
    python -m crawler.site2.tasks.backfill --start 2026-03-01 --end 2026-03-14
    python -m crawler.site2.tasks.backfill --formal   # cleanup + backfill 2026-03-01 to now
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler.site1.windowing import daily_windows
from crawler.site2 import config
from .core import run_window_series
from .cleanup import run as run_cleanup

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

FORMAL_START_DATE = "2026-03-01"


def run(
    start_date: str,
    end_date: str,
    notice_type: str | None = None,
    db_path: str = "notices.db",
) -> dict:
    """
    Run backfill for site2 from start_date to end_date.
    Returns stats: {'fetched': int, 'upserted': int, 'errors': int}
    """
    windows = daily_windows(start_date, end_date)
    types_to_run = [notice_type] if notice_type else list(config.NOTICE_TYPES.keys())
    
    logger.info(f"=== Site2 backfill: {start_date} ~ {end_date}, types={types_to_run}, windows={len(windows)} ===")
    
    stats = run_window_series(windows, types_to_run, db_path)
    
    logger.info(f"=== Site2 backfill complete: fetched={stats['fetched']}, upserted={stats['upserted']}, errors={stats['errors']} ===")
    
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Site2 backfill initialization")
    parser.add_argument("--formal", action="store_true", help="Formal init: cleanup + backfill 2026-03-01 to now")
    parser.add_argument("--start", help="Start date, e.g. 2026-03-01 (required unless --formal)")
    parser.add_argument("--end", help="End date (inclusive), e.g. 2026-03-14 (required unless --formal)")
    parser.add_argument("--type", help="Notice type (59 or 00101), defaults to both")
    parser.add_argument("--db", default="notices.db", help="SQLite DB path")
    parser.add_argument("--skip-cleanup", action="store_true", help="With --formal, skip cleanup step")
    args = parser.parse_args()

    if args.formal:
        start_date = FORMAL_START_DATE
        end_date = datetime.now().strftime("%Y-%m-%d")
        if not args.skip_cleanup:
            logger.info("=== Formal init: cleaning site2 test data ===")
            run_cleanup(args.db, dry_run=False)
        run(start_date, end_date, None, args.db)
    else:
        if not args.start or not args.end:
            parser.error("--start and --end are required unless --formal")
        run(args.start, args.end, args.type, args.db)


if __name__ == "__main__":
    main()
