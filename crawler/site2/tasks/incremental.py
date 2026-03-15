"""
Site2 incremental task (every 2 hours)

Usage:
    python -m crawler.site2.tasks.incremental
    python -m crawler.site2.tasks.incremental --db notices.db
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler.site2 import config
from .core import run_window_series

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def safety_overlap_windows(now: datetime | None = None, overlap_hours: int = 4) -> list[tuple[str, str]]:
    """
    Generate windows with safety overlap.
    Instead of just the last 2-hour window, we scan the last `overlap_hours` hours.
    This ensures boundary records and delayed publications are captured.
    """
    if now is None:
        now = datetime.now()
    
    fmt = "%Y-%m-%d %H:%M:%S"
    
    end_time = now.replace(second=0, microsecond=0)
    start_time = end_time - timedelta(hours=overlap_hours)
    
    return [(start_time.strftime(fmt), end_time.strftime(fmt))]


def run(db_path: str = "notices.db", now: datetime | None = None) -> dict:
    """
    Run incremental fetch for site2 with safety overlap window.
    Returns stats: {'fetched': int, 'upserted': int, 'errors': int}
    """
    windows = safety_overlap_windows(now, overlap_hours=4)
    
    logger.info(f"=== Site2 incremental: window {windows[0][0]} ~ {windows[0][1]} ===")
    
    stats = run_window_series(windows, list(config.NOTICE_TYPES.keys()), db_path)
    
    logger.info(f"=== Site2 incremental complete: fetched={stats['fetched']}, upserted={stats['upserted']}, errors={stats['errors']} ===")
    
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Site2 incremental fetch")
    parser.add_argument("--db", default="notices.db", help="SQLite DB path")
    args = parser.parse_args()
    
    run(args.db)


if __name__ == "__main__":
    main()
