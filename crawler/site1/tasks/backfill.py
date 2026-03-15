"""
SITE1 初始化采集任务（backfill）

用法:
    python -m crawler.site1.tasks.backfill --start 2026-03-01 --end 2026-03-14
    python -m crawler.site1.tasks.backfill --start 2026-03-01 --end 2026-03-14 --category 002001009
    python -m crawler.site1.tasks.backfill --start 2026-03-01 --end 2026-03-14 --db notices.db
"""
from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

# 将项目根加入 sys.path，支持直接 python -m 运行
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler.site1 import client, config, windowing
from crawler import storage

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def crawl_window(
    conn,
    category_id: str,
    start_time: str,
    end_time: str,
    depth: int = 0,
) -> int:
    """对单个时间窗口执行：探测 → 拆窗或分页拉取 → 落库。返回落库条数。"""
    indent = "  " * depth
    total = client.probe_total(category_id, start_time, end_time)
    logger.info("%s[%s] %s ~ %s  total=%d", indent, category_id, start_time, end_time, total)

    if total == 0:
        return 0

    if total > config.MAX_WINDOW_COUNT:
        sub_windows = windowing.split_window_to_smaller(start_time, end_time)
        if len(sub_windows) == 1:
            # 窗口太小无法再拆，强制分页
            logger.warning("%s窗口已最小化但仍超阈值，强制分页拉取", indent)
        else:
            count = 0
            for sub_start, sub_end in sub_windows:
                count += crawl_window(conn, category_id, sub_start, sub_end, depth + 1)
            return count

    # 分页拉取
    pn = 0
    saved = 0
    while True:
        page = client.fetch_page(category_id, start_time, end_time, pn)
        records = page["records"]
        if not records:
            break
        # 将原始 JSON 写入 raw_json 字段
        enriched = []
        for r in records:
            row = dict(r)
            row["raw_json"] = json.dumps(r, ensure_ascii=False)
            enriched.append(row)
        n = storage.upsert_records(conn, enriched, config.SITE)
        saved += n
        logger.info("%s  pn=%d  records=%d  saved=%d", indent, pn, len(records), n)
        pn += len(records)
        if pn >= page["totalcount"]:
            break
    return saved


def run(
    start_date: str,
    end_date: str,
    category_ids: list[str],
    db_path: str = "notices.db",
) -> None:
    conn = storage.get_connection(db_path)
    try:
        windows = windowing.daily_windows(start_date, end_date)
        for category_id in category_ids:
            logger.info("=== 开始 backfill: category=%s  windows=%d ===", category_id, len(windows))
            total_saved = 0
            for start_time, end_time in windows:
                total_saved += crawl_window(conn, category_id, start_time, end_time)
            logger.info("=== backfill 完成: category=%s  total_saved=%d ===", category_id, total_saved)
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="SITE1 backfill 初始化采集")
    parser.add_argument("--start", required=True, help="起始日期，如 2026-03-01")
    parser.add_argument("--end", required=True, help="终止日期（含），如 2026-03-14")
    parser.add_argument(
        "--category",
        default=",".join(config.ALL_CATEGORY_IDS),
        help="分类 ID，逗号分隔，默认全部三类",
    )
    parser.add_argument("--db", default="notices.db", help="SQLite DB 路径")
    args = parser.parse_args()

    category_ids = [c.strip() for c in args.category.split(",") if c.strip()]
    run(args.start, args.end, category_ids, args.db)


if __name__ == "__main__":
    main()
