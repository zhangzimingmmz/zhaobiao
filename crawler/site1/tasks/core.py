from __future__ import annotations

import logging
from typing import Any

from crawler import storage
from crawler.site1 import client, config
from crawler.site1.detail import merge_list_and_detail_record

logger = logging.getLogger(__name__)


def enrich_records_with_detail(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enriched: list[dict[str, Any]] = []
    for record in records:
        detail = None
        try:
            detail = client.fetch_detail_page(record)
        except Exception as exc:
            logger.warning("site1 detail fetch failed for %s: %s", record.get("id"), exc)
        enriched.append(merge_list_and_detail_record(record, detail))
    return enriched


def upsert_enriched_records(conn: Any, records: list[dict[str, Any]], *, merge: bool = False) -> int:
    if not records:
        return 0
    return storage.upsert_records(conn, records, config.SITE, merge=merge)
