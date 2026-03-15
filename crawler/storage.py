# 公告统一表 notices 的落库模块
# 以 (site, id) 做 upsert，字段与 docs/存储表结构说明.md 一致

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# 表结构约定的列名（与 migrations 一致）
NOTICES_COLUMNS = (
    "site", "id", "title", "publish_time", "info_date", "source_name",
    "tradingsourcevalue", "region_name", "region_code", "category_num", "channel",
    "linkurl", "origin_url", "content", "description", "open_tender_code",
    "plan_id", "budget", "purchase_manner", "open_tender_time", "purchaser", "agency",
    "first_seen_at", "last_seen_at", "raw_json", "purchase_nature",
)

# 可被后续运行补全的字段：merge 模式下，空值/NULL 不覆盖已有值
_MERGE_PRESERVE_COLUMNS = (
    "category_num", "content", "purchase_manner", "purchase_nature", "open_tender_code",
    "plan_id", "purchaser", "agency", "raw_json", "region_name", "region_code", "source_name",
)




def _migrations_dir() -> Path:
    return Path(__file__).resolve().parent / "migrations"


def ensure_schema(conn: sqlite3.Connection) -> None:
    """执行 migrations 下 SQL，确保 notices 表存在。"""
    migrations = _migrations_dir()
    if not migrations.exists():
        return
    for p in sorted(migrations.glob("*.sql")):
        try:
            conn.executescript(p.read_text(encoding="utf-8"))
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e).lower():
                continue  # 列已存在，跳过（如 003_add_purchase_nature）
            raise


def _iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _row_to_tuple(row: dict[str, Any], site: str, now: str) -> tuple:
    """将一条记录转为表列顺序的元组，缺失键用 None。"""
    get = lambda k: row.get(k)
    raw = row.get("raw_json")
    if raw is not None and not isinstance(raw, str):
        raw = json.dumps(raw, ensure_ascii=False)
    return (
        site,
        str(row["id"]),
        str(row.get("title") or ""),
        get("publish_time") or get("webdate") or get("noticeTime"),
        get("info_date") or get("infodate"),
        get("source_name") or get("zhuanzai") or get("author"),
        get("tradingsourcevalue"),
        get("region_name"),
        get("region_code"),
        get("category_num") or get("categorynum") or get("noticeType"),
        get("channel"),
        get("linkurl"),
        get("origin_url"),
        get("content"),
        get("description"),
        get("open_tender_code") or get("openTenderCode"),
        get("plan_id") or get("planId"),
        get("budget"),
        get("purchase_manner") or get("purchaseManner"),
        get("open_tender_time") or get("openTenderTime"),
        get("purchaser"),
        get("agency"),
        get("first_seen_at"),
        get("last_seen_at"),
        raw,
        get("purchase_nature") or get("purchaseNature"),
    )


def upsert_one(
    conn: sqlite3.Connection,
    row: dict[str, Any],
    site: str,
    *,
    first_seen_at: str | None = None,
    last_seen_at: str | None = None,
) -> None:
    """按 (site, id) 插入或更新一条公告。row 键可为存储列名或原始接口字段名（如 webdate、noticeTime）。"""
    now = _iso_now()
    if first_seen_at is None:
        first_seen_at = now
    if last_seen_at is None:
        last_seen_at = now
    row = dict(row)
    row.setdefault("first_seen_at", first_seen_at)
    row.setdefault("last_seen_at", last_seen_at)
    t = _row_to_tuple(row, site, now)
    placeholders = ",".join("?" * len(NOTICES_COLUMNS))
    columns = ",".join(NOTICES_COLUMNS)
    upd = ",".join(f"{c}=excluded.{c}" for c in NOTICES_COLUMNS if c not in ("site", "id"))
    sql = f"""
    INSERT INTO notices ({columns}) VALUES ({placeholders})
    ON CONFLICT(site, id) DO UPDATE SET {upd}
    """
    conn.execute(sql, t)
    conn.commit()


def upsert_records(
    conn: sqlite3.Connection,
    records: list[dict[str, Any]],
    site: str,
    *,
    first_seen_at: str | None = None,
    last_seen_at: str | None = None,
    merge: bool = False,
) -> int:
    """批量 upsert；每条以 (site, id) 去重。返回写入条数。
    merge=True 时，可补全字段的空值不覆盖已有值，便于后续运行补全不完整记录。"""
    if not records:
        return 0
    now = _iso_now()
    if first_seen_at is None:
        first_seen_at = now
    if last_seen_at is None:
        last_seen_at = now
    rows = []
    for r in records:
        row = dict(r)
        row.setdefault("first_seen_at", first_seen_at)
        row.setdefault("last_seen_at", last_seen_at)
        rows.append(_row_to_tuple(row, site, now))
    placeholders = ",".join("?" * len(NOTICES_COLUMNS))
    columns = ",".join(NOTICES_COLUMNS)
    if merge:
        upd_parts = []
        for c in NOTICES_COLUMNS:
            if c in ("site", "id"):
                continue
            if c in _MERGE_PRESERVE_COLUMNS:
                # Preserve existing value when new value is NULL or empty
                upd_parts.append(f"{c}=COALESCE(NULLIF(COALESCE(excluded.{c},''),''), notices.{c})")
            else:
                upd_parts.append(f"{c}=excluded.{c}")
        upd = ",".join(upd_parts)
    else:
        upd = ",".join(f"{c}=excluded.{c}" for c in NOTICES_COLUMNS if c not in ("site", "id"))
    sql = f"""
    INSERT INTO notices ({columns}) VALUES ({placeholders})
    ON CONFLICT(site, id) DO UPDATE SET {upd}
    """
    conn.executemany(sql, rows)
    conn.commit()
    return len(rows)


def get_connection(db_path: str | Path) -> sqlite3.Connection:
    """打开 SQLite 连接并确保 schema，调用方负责 close。"""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    ensure_schema(conn)
    return conn
