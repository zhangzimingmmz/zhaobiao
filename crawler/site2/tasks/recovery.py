"""
Site2 recovery task (daily, re-scans last 48 hours)

Usage:
    python -m crawler.site2.tasks.recovery
    python -m crawler.site2.tasks.recovery --db notices.db
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler.site1.windowing import last_48h_windows
from crawler.site2 import config
from .core import run_window_series

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def run(db_path: str = "notices.db", now: datetime | None = None) -> dict:
    """
    Run recovery fetch for site2 (last 48h windows).
    Returns stats: {'fetched': int, 'upserted': int, 'errors': int}
    """
    windows = last_48h_windows(now)
    
    logger.info(f"=== Site2 recovery: {len(windows)} windows ===")
    
    stats = run_window_series(windows, list(config.NOTICE_TYPES.keys()), db_path)
    
    logger.info(f"=== Site2 recovery complete: fetched={stats['fetched']}, upserted={stats['upserted']}, errors={stats['errors']} ===")
    
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description="Site2 recovery fetch (48h)")
    parser.add_argument("--db", default="notices.db", help="SQLite DB path")
    args = parser.parse_args()
    
    run(args.db)


if __name__ == "__main__":
    main()
