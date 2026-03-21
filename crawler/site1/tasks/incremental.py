"""
SITE1 增量采集任务（incremental）

每 2 小时抓取上一个完整 2 小时窗口。

用法:
    python -m crawler.site1.tasks.incremental
    python -m crawler.site1.tasks.incremental --db notices.db
"""
from __future__ import annotations

import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler.site1 import client, config, windowing
from crawler.site1.tasks.core import enrich_records_with_detail, upsert_enriched_records
from crawler import storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def run(db_path: str = "notices.db", now: datetime | None = None) -> None:
    if now is None:
        now = datetime.now()
    start_time, end_time = windowing.previous_two_hour_window(now)
    logger.info("=== incremental: 窗口 %s ~ %s ===", start_time, end_time)

    conn = storage.get_connection(db_path)
    try:
        for category_id in config.ALL_CATEGORY_IDS:
            total = client.probe_total(category_id, start_time, end_time)
            logger.info("[%s] total=%d", category_id, total)
            if total == 0:
                continue

            sub_windows = [(start_time, end_time)]
            if total > config.MAX_WINDOW_COUNT:
                sub_windows = windowing.split_window_to_smaller(start_time, end_time)

            for sw_start, sw_end in sub_windows:
                pn = 0
                while True:
                    page = client.fetch_page(category_id, sw_start, sw_end, pn)
                    records = page["records"]
                    if not records:
                        break
                    enriched = enrich_records_with_detail(records)
                    n = upsert_enriched_records(conn, enriched)
                    logger.info("  [%s] pn=%d saved=%d", category_id, pn, n)
                    pn += len(records)
                    if pn >= page["totalcount"]:
                        break
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="SITE1 增量采集")
    parser.add_argument("--db", default="notices.db", help="SQLite DB 路径")
    args = parser.parse_args()
    run(args.db)


if __name__ == "__main__":
    main()
