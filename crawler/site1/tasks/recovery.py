"""
SITE1 补偿采集任务（recovery）

每日一次，回抓最近 48 小时，依赖 (site, id) 去重。

用法:
    python -m crawler.site1.tasks.recovery
    python -m crawler.site1.tasks.recovery --db notices.db
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler.site1 import client, config, windowing
from crawler import storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def run(db_path: str = "notices.db", now: datetime | None = None) -> None:
    if now is None:
        now = datetime.now()
    windows = windowing.last_48h_windows(now)
    logger.info("=== recovery: 窗口数=%d ===", len(windows))

    conn = storage.get_connection(db_path)
    try:
        for category_id in config.ALL_CATEGORY_IDS:
            total_saved = 0
            for start_time, end_time in windows:
                total = client.probe_total(category_id, start_time, end_time)
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
                        enriched = [
                            {**r, "raw_json": json.dumps(r, ensure_ascii=False)} for r in records
                        ]
                        n = storage.upsert_records(conn, enriched, config.SITE)
                        total_saved += n
                        pn += len(records)
                        if pn >= page["totalcount"]:
                            break
            logger.info("[%s] recovery saved=%d", category_id, total_saved)
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="SITE1 补偿采集")
    parser.add_argument("--db", default="notices.db", help="SQLite DB 路径")
    args = parser.parse_args()
    run(args.db)


if __name__ == "__main__":
    main()
