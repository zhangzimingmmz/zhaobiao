import logging
import json
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import List, Tuple, Optional

from crawler.site1.windowing import daily_windows, split_window_to_smaller
from crawler import storage
from crawler.site2 import config, client, session

logger = logging.getLogger(__name__)


def process_window(
    conn,
    notice_type: str,
    start_time: str,
    end_time: str,
    depth: int = 0,
    sess=None,
) -> tuple:
    """
    Process a single time window: probe total, split if too large, fetch pages and details.
    All writes use (site, id) upsert via storage.upsert_records, so repeated runs of the
    same window converge to a single record per notice without duplicates.
    Returns (stats, sess): stats dict with fetched/upserted/errors, and session for reuse.
    """
    indent = "  " * depth
    stats = {"fetched": 0, "upserted": 0, "errors": 0}

    sess = session.ensure_fresh(sess)
    for probe_attempt in range(config.MAX_RETRIES):
        try:
            total = client.probe_total(sess, notice_type, start_time, end_time)
            break
        except Exception as e:
            if session.is_proxy_error(e):
                logger.warning(f"{indent}Proxy error during probe (attempt {probe_attempt+1}), rotating session")
                sess = session.create_session()
            else:
                logger.warning(f"{indent}Timeout during probe (attempt {probe_attempt+1}), retrying same session")
                if probe_attempt < config.MAX_RETRIES - 1:
                    time.sleep(config.RETRY_BACKOFF_FACTOR * (probe_attempt + 1))
            if probe_attempt == config.MAX_RETRIES - 1:
                raise
    logger.info(f"{indent}[{notice_type}] Window {start_time} - {end_time}: source_total={total}")

    if total == 0:
        return stats, sess

    if total > config.MAX_WINDOW_COUNT:
        logger.info(f"{indent}Total {total} > {config.MAX_WINDOW_COUNT}, splitting window")
        sub_windows = split_window_to_smaller(start_time, end_time, parts=2)
        if len(sub_windows) == 1:
            logger.warning(f"{indent}Window cannot be split further, forcing pagination")
        else:
            for sub_start, sub_end in sub_windows:
                sub_stats, sess = process_window(conn, notice_type, sub_start, sub_end, depth + 1, sess=sess)
                stats["fetched"] += sub_stats["fetched"]
                stats["upserted"] += sub_stats["upserted"]
                stats["errors"] += sub_stats["errors"]
            return stats, sess

    curr_page = 1
    total_fetched = 0
    consecutive_failures = 0
    max_consecutive_failures = 5
    
    while True:
        sess = session.ensure_fresh(sess)
        try:
            res = client.fetch_list(sess, notice_type, start_time, end_time, curr_page, config.DEFAULT_PAGE_SIZE)
        except Exception as e:
            consecutive_failures += 1
            if consecutive_failures >= max_consecutive_failures:
                logger.error(f"{indent}List fetch failed {consecutive_failures} times in a row, giving up")
                break
            if session.is_proxy_error(e):
                logger.warning(f"{indent}Proxy error on page {curr_page}, rotating session (attempt {consecutive_failures}/{max_consecutive_failures})")
                sess = session.create_session()
            else:
                backoff = config.RETRY_BACKOFF_FACTOR * consecutive_failures
                logger.warning(f"{indent}Timeout on page {curr_page}, retrying same session (attempt {consecutive_failures}/{max_consecutive_failures}), sleep {backoff}s")
                time.sleep(backoff)
            continue

        rows = res.get("rows", [])
        fetch_total = res.get("total", 0)
        
        if not rows:
            consecutive_failures += 1
            if consecutive_failures >= max_consecutive_failures:
                logger.warning(f"{indent}Empty rows on page {curr_page} after {consecutive_failures} attempts, stopping")
                break
            backoff = config.RETRY_BACKOFF_FACTOR * consecutive_failures
            logger.warning(f"{indent}Empty rows on page {curr_page}, rebuilding session (attempt {consecutive_failures}/{max_consecutive_failures}), sleep {backoff}s")
            time.sleep(backoff)
            sess = session.create_session()
            continue
        
        consecutive_failures = 0
        records_to_upsert = []

        sess = session.ensure_fresh(sess)

        def _fetch_one(row):
            try:
                d = client.fetch_detail(sess, notice_type, row)
                return (row, d if d else {})
            except Exception:
                return (row, {})

        with ThreadPoolExecutor(max_workers=config.DETAIL_PARALLEL_WORKERS) as executor:
            results = list(executor.map(_fetch_one, rows))

        for row, detail in results:
            row_id = row.get("id")
            if not row_id:
                logger.warning(f"{indent}Skipping row without id: {row}")
                continue
            if not detail:
                detail_success = False
                for attempt in range(config.MAX_RETRIES):
                    sess = session.ensure_fresh(sess)
                    try:
                        detail = client.fetch_detail(sess, notice_type, row)
                    except Exception as e:
                        logger.warning(f"{indent}Detail transport error for {row_id} (attempt {attempt+1}/{config.MAX_RETRIES}): {e}")
                        if session.is_proxy_error(e):
                            sess = session.create_session()
                        elif attempt < config.MAX_RETRIES - 1:
                            time.sleep(config.RETRY_BACKOFF_FACTOR * (attempt + 1))
                        continue
                    if detail:
                        detail_success = True
                        break
                    logger.warning(f"{indent}Detail empty for {row_id} (attempt {attempt+1}/{config.MAX_RETRIES})")
                    if attempt < config.MAX_RETRIES - 1:
                        time.sleep(config.RETRY_BACKOFF_FACTOR * (attempt + 1))
                        sess = session.create_session()
                if not detail_success:
                    stats["errors"] += 1

            raw_payload = dict(row) if row else {}
            if detail:
                raw_payload["_detail"] = detail
            raw_json_val = json.dumps(raw_payload, ensure_ascii=False) if raw_payload else None

            mapped_record = {
                "id": str(row_id),
                "title": row.get("title") or detail.get("title"),
                "publish_time": row.get("noticeTime") or detail.get("noticeTime"),
                "source_name": row.get("author") or detail.get("author"),
                "region_name": row.get("regionName") or detail.get("regionName"),
                "region_code": row.get("regionCode") or detail.get("regionCode"),
                "category_num": notice_type,
                "open_tender_code": row.get("openTenderCode") or detail.get("openTenderCode"),
                "plan_id": row.get("planId") or detail.get("planId"),
                "purchase_manner": detail.get("purchaseManner"),
                "purchase_nature": row.get("purchaseNature") or detail.get("purchaseNature"),
                "purchaser": row.get("purchaser") or detail.get("purchaser"),
                "agency": row.get("agency") or detail.get("agency"),
                "budget": row.get("budget") or detail.get("budget"),
                "open_tender_time": row.get("openTenderTime") or detail.get("openTenderTime"),
                "description": row.get("description") or detail.get("description"),
                "content": detail.get("content", ""),
                "raw_json": raw_json_val,
            }
            records_to_upsert.append(mapped_record)
        
        if records_to_upsert:
            n = storage.upsert_records(conn, records_to_upsert, config.SITE_ID, merge=True)
            stats["upserted"] += n
            logger.info(f"{indent}Page {curr_page}: fetched={len(rows)}, upserted={n}, cumulative={stats['upserted']}")
        
        total_fetched += len(rows)
        stats["fetched"] += len(rows)
        
        if total_fetched >= fetch_total or fetch_total == 0:
            break
        
        curr_page += 1

    return stats, sess


def run_window_series(
    windows: List[Tuple[str, str]],
    notice_types: Optional[List[str]] = None,
    db_path: Optional[str] = None,
) -> dict:
    """
    Run a series of windows for specified notice types.
    Returns aggregated stats: {'fetched': int, 'upserted': int, 'errors': int}
    """
    if db_path is None:
        db_path = Path(__file__).resolve().parents[3] / "data" / "notices.db"
    else:
        p = Path(db_path)
        if not p.is_absolute():
            p = Path(__file__).resolve().parents[3] / "data" / db_path
        db_path = p
    
    conn = storage.get_connection(str(db_path))
    types_to_run = notice_types if notice_types else list(config.NOTICE_TYPES.keys())
    total_stats = {"fetched": 0, "upserted": 0, "errors": 0}
    
    try:
        for notice_type in types_to_run:
            type_stats = {"fetched": 0, "upserted": 0, "errors": 0}
            logger.info(f"=== [{notice_type}] Processing {len(windows)} windows ===")
            
            sess = None
            for start_time, end_time in windows:
                try:
                    window_stats, sess = process_window(conn, notice_type, start_time, end_time, sess=sess)
                    type_stats["fetched"] += window_stats["fetched"]
                    type_stats["upserted"] += window_stats["upserted"]
                    type_stats["errors"] += window_stats["errors"]
                except Exception as e:
                    logger.error(f"Failed window {start_time}-{end_time} for {notice_type}: {e}", exc_info=True)
                    type_stats["errors"] += 1
                    sess = None
            
            logger.info(f"=== [{notice_type}] Done: fetched={type_stats['fetched']}, upserted={type_stats['upserted']}, errors={type_stats['errors']} ===")
            total_stats["fetched"] += type_stats["fetched"]
            total_stats["upserted"] += type_stats["upserted"]
            total_stats["errors"] += type_stats["errors"]
    finally:
        conn.close()
    
    return total_stats
