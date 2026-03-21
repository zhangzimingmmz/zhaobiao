"""
SITE1 详情回填任务

对已有 site1 记录补抓详情页，并用 merge 方式写回 notices。
"""
from __future__ import annotations

import argparse
import json
import logging
import sqlite3
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler import storage
from crawler.site1 import config
from crawler.site1.tasks.core import enrich_records_with_detail, upsert_enriched_records

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def _load_candidates(conn: sqlite3.Connection, category: str | None, limit: int | None) -> list[dict]:
    sql = """
    SELECT site, id, title, publish_time, info_date, source_name,
           tradingsourcevalue, region_name, region_code, category_num,
           channel, linkurl, origin_url, content, description,
           open_tender_code, plan_id, budget, purchase_manner,
           open_tender_time, purchaser, agency, raw_json, purchase_nature
    FROM notices
    WHERE site = ?
      AND linkurl IS NOT NULL AND trim(linkurl) <> ''
    """
    params: list[object] = [config.SITE]
    if category:
        sql += " AND category_num = ?"
        params.append(category)
    sql += " ORDER BY publish_time DESC"
    if limit is not None:
        sql += " LIMIT ?"
        params.append(limit)

    rows = conn.execute(sql, params).fetchall()
    candidates: list[dict] = []
    for row in rows:
        raw_json = row["raw_json"]
        list_payload: dict[str, object] = {}
        if raw_json:
            try:
                parsed = json.loads(raw_json)
                if isinstance(parsed, dict):
                    if "_detail" in parsed:
                        continue
                    if "_list" in parsed and isinstance(parsed["_list"], dict):
                        list_payload = dict(parsed["_list"])
                    else:
                        list_payload = dict(parsed)
            except Exception:
                list_payload = {}
        if not list_payload:
            list_payload = {
                "id": row["id"],
                "title": row["title"],
                "webdate": row["publish_time"],
                "infodate": row["info_date"],
                "zhuanzai": row["source_name"],
                "tradingsourcevalue": row["tradingsourcevalue"],
                "region_name": row["region_name"],
                "region_code": row["region_code"],
                "categorynum": row["category_num"],
                "channel": row["channel"],
                "linkurl": row["linkurl"],
                "origin_url": row["origin_url"],
                "content": row["content"],
                "description": row["description"],
                "open_tender_code": row["open_tender_code"],
                "plan_id": row["plan_id"],
                "budget": row["budget"],
                "purchase_manner": row["purchase_manner"],
                "open_tender_time": row["open_tender_time"],
                "purchaser": row["purchaser"],
                "agency": row["agency"],
                "purchase_nature": row["purchase_nature"],
            }
        candidates.append(list_payload)
    return candidates


def run(db_path: str = "notices.db", category: str | None = None, limit: int | None = None) -> int:
    conn = storage.get_connection(db_path)
    try:
        candidates = _load_candidates(conn, category, limit)
        logger.info("site1 detail backfill candidates=%d", len(candidates))
        enriched = enrich_records_with_detail(candidates)
        saved = upsert_enriched_records(conn, enriched, merge=True)
        logger.info("site1 detail backfill saved=%d", saved)
        return saved
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="SITE1 详情回填")
    parser.add_argument("--db", default="notices.db", help="SQLite DB 路径")
    parser.add_argument("--category", default=None, help="仅回填指定分类")
    parser.add_argument("--limit", type=int, default=None, help="限制回填条数")
    args = parser.parse_args()
    run(args.db, category=args.category, limit=args.limit)


if __name__ == "__main__":
    main()
