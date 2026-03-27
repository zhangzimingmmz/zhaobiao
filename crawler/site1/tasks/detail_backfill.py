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
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from crawler import storage
from crawler.site1 import client, config
from crawler.site1.detail import merge_list_and_detail_record
from crawler.site1.tasks.core import upsert_enriched_records

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


DEFAULT_CATEGORY_ORDER = ("002001009", "002001010", "002001001", "002002001")


@dataclass
class CategoryBackfillStats:
    category: str
    candidates: int = 0
    skipped_existing: int = 0
    attempted: int = 0
    succeeded: int = 0
    failed: int = 0
    saved: int = 0
    recent_failures: list[str] = field(default_factory=list)


@dataclass
class BackfillRunStats:
    categories: list[CategoryBackfillStats] = field(default_factory=list)

    @property
    def saved(self) -> int:
        return sum(item.saved for item in self.categories)

    @property
    def failed(self) -> int:
        return sum(item.failed for item in self.categories)

    @property
    def candidates(self) -> int:
        return sum(item.candidates for item in self.categories)

    @property
    def skipped_existing(self) -> int:
        return sum(item.skipped_existing for item in self.categories)


def _normalize_categories(categories: list[str] | None) -> list[str]:
    if not categories:
        return list(DEFAULT_CATEGORY_ORDER)
    ordered: list[str] = []
    seen: set[str] = set()
    for category in categories:
        if category not in config.CATEGORIES:
            raise ValueError(f"unsupported site1 category: {category}")
        if category not in seen:
            ordered.append(category)
            seen.add(category)
    return ordered


def _iter_batches(records: list[dict], batch_size: int) -> Iterable[list[dict]]:
    for start in range(0, len(records), batch_size):
        yield records[start : start + batch_size]


def _load_candidates(
    conn: sqlite3.Connection, category: str | None, limit: int | None
) -> tuple[list[dict], int]:
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
    skipped_existing = 0
    for row in rows:
        raw_json = row["raw_json"]
        list_payload: dict[str, object] = {}
        if raw_json:
            try:
                parsed = json.loads(raw_json)
                if isinstance(parsed, dict):
                    if "_detail" in parsed:
                        skipped_existing += 1
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
    return candidates, skipped_existing


def _process_category(
    conn: sqlite3.Connection,
    *,
    category: str,
    limit: int | None,
    batch_size: int,
    sleep_seconds: float,
    max_failures: int | None,
    dry_run: bool,
) -> CategoryBackfillStats:
    candidates, skipped_existing = _load_candidates(conn, category, limit)
    stats = CategoryBackfillStats(
        category=category,
        candidates=len(candidates),
        skipped_existing=skipped_existing,
    )
    logger.info(
        "[%s] backfill candidates=%d skipped_existing=%d",
        category,
        stats.candidates,
        stats.skipped_existing,
    )
    if not candidates:
        return stats

    for batch_index, batch in enumerate(_iter_batches(candidates, batch_size), start=1):
        merged_records: list[dict] = []
        for record in batch:
            stats.attempted += 1
            try:
                detail = client.fetch_detail_page(record)
                merged_records.append(merge_list_and_detail_record(record, detail))
                stats.succeeded += 1
            except Exception as exc:
                stats.failed += 1
                failure = f"{record.get('id')}: {exc}"
                stats.recent_failures.append(failure)
                stats.recent_failures = stats.recent_failures[-5:]
                logger.warning("[%s] detail fetch failed for %s: %s", category, record.get("id"), exc)
                if max_failures is not None and stats.failed >= max_failures:
                    logger.error("[%s] stop after reaching max_failures=%d", category, max_failures)
                    break
            if sleep_seconds > 0:
                time.sleep(sleep_seconds)

        if merged_records and not dry_run:
            stats.saved += upsert_enriched_records(conn, merged_records, merge=True)

        logger.info(
            "[%s] batch=%d attempted=%d succeeded=%d failed=%d saved=%d",
            category,
            batch_index,
            stats.attempted,
            stats.succeeded,
            stats.failed,
            stats.saved,
        )
        if max_failures is not None and stats.failed >= max_failures:
            break

    return stats


def run(db_path: str = "notices.db", category: str | None = None, limit: int | None = None) -> int:
    stats = run_with_stats(db_path=db_path, categories=[category] if category else None, limit=limit)
    return stats.saved


def run_with_stats(
    *,
    db_path: str = "notices.db",
    categories: list[str] | None = None,
    limit: int | None = None,
    batch_size: int = 100,
    sleep_seconds: float = 0.2,
    max_failures: int | None = None,
    dry_run: bool = False,
) -> BackfillRunStats:
    selected_categories = _normalize_categories(categories)
    conn = storage.get_connection(db_path)
    try:
        run_stats = BackfillRunStats()
        for current_category in selected_categories:
            category_stats = _process_category(
                conn,
                category=current_category,
                limit=limit,
                batch_size=batch_size,
                sleep_seconds=sleep_seconds,
                max_failures=max_failures,
                dry_run=dry_run,
            )
            run_stats.categories.append(category_stats)
            logger.info(
                "[%s] done candidates=%d skipped_existing=%d succeeded=%d failed=%d saved=%d",
                current_category,
                category_stats.candidates,
                category_stats.skipped_existing,
                category_stats.succeeded,
                category_stats.failed,
                category_stats.saved,
            )
        logger.info(
            "site1 detail backfill total categories=%d candidates=%d skipped_existing=%d failed=%d saved=%d dry_run=%s",
            len(run_stats.categories),
            run_stats.candidates,
            run_stats.skipped_existing,
            run_stats.failed,
            run_stats.saved,
            dry_run,
        )
        return run_stats
    finally:
        conn.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="SITE1 详情回填")
    parser.add_argument("--db", default="notices.db", help="SQLite DB 路径")
    parser.add_argument(
        "--category",
        action="append",
        default=None,
        help="仅回填指定分类，可重复传入多次；默认按 002001009 -> 002001010 -> 002001001 -> 002002001 顺序全跑",
    )
    parser.add_argument("--limit", type=int, default=None, help="每个分类限制回填条数")
    parser.add_argument("--batch-size", type=int, default=100, help="每批写库条数")
    parser.add_argument("--sleep-seconds", type=float, default=0.2, help="每条详情请求之间的休眠秒数")
    parser.add_argument("--max-failures", type=int, default=None, help="单个分类达到失败数后提前停止")
    parser.add_argument("--dry-run", action="store_true", help="仅抓取与统计，不写回数据库")
    args = parser.parse_args()
    run_with_stats(
        db_path=args.db,
        categories=args.category,
        limit=args.limit,
        batch_size=args.batch_size,
        sleep_seconds=args.sleep_seconds,
        max_failures=args.max_failures,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
