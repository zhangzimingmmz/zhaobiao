from __future__ import annotations

import argparse
import logging
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path

from crawler.storage import get_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RetentionSummary:
    days: int
    cutoff: str
    notices: int
    favorites: int
    min_publish_time: str | None
    max_publish_time: str | None
    grouped_rows: list[tuple[str, str, int]]
    applied: bool


def _resolve_db_path(db_path: str) -> Path:
    path = Path(db_path)
    if path.is_absolute():
        return path
    project_root = Path(__file__).resolve().parents[1]
    if path.parts and path.parts[0] == "data":
        return project_root / path
    return project_root / "data" / path


def _utc_now_text() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _cutoff_text(days: int, now_text: str | None = None) -> str:
    base = (
        datetime.strptime(now_text, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
        if now_text
        else datetime.now(timezone.utc)
    )
    return (base - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")


def _table_exists(conn: sqlite3.Connection, table: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
        (table,),
    ).fetchone()
    return row is not None


def _collect_summary(conn: sqlite3.Connection, cutoff: str) -> RetentionSummary:
    notices = conn.execute(
        """
        SELECT COUNT(*)
        FROM notices
        WHERE publish_time IS NOT NULL AND publish_time != '' AND publish_time < ?
        """,
        (cutoff,),
    ).fetchone()[0]

    min_publish_time, max_publish_time = conn.execute(
        """
        SELECT MIN(publish_time), MAX(publish_time)
        FROM notices
        WHERE publish_time IS NOT NULL AND publish_time != '' AND publish_time < ?
        """,
        (cutoff,),
    ).fetchone()

    grouped_rows = [
        (row[0], row[1] or "", row[2])
        for row in conn.execute(
            """
            SELECT site, category_num, COUNT(*)
            FROM notices
            WHERE publish_time IS NOT NULL AND publish_time != '' AND publish_time < ?
            GROUP BY site, category_num
            ORDER BY site, category_num
            """,
            (cutoff,),
        ).fetchall()
    ]

    favorites = 0
    if _table_exists(conn, "user_favorites"):
        favorites = conn.execute(
            """
            SELECT COUNT(*)
            FROM user_favorites AS f
            WHERE f.target_type = 'bid'
              AND EXISTS (
                SELECT 1
                FROM notices AS n
                WHERE n.site = f.target_site
                  AND n.id = f.target_id
                  AND n.publish_time IS NOT NULL
                  AND n.publish_time != ''
                  AND n.publish_time < ?
              )
            """,
            (cutoff,),
        ).fetchone()[0]

    return RetentionSummary(
        days=0,
        cutoff=cutoff,
        notices=notices,
        favorites=favorites,
        min_publish_time=min_publish_time,
        max_publish_time=max_publish_time,
        grouped_rows=grouped_rows,
        applied=False,
    )


def run(
    db_path: str = "notices.db",
    *,
    days: int = 30,
    apply: bool = False,
    now_text: str | None = None,
) -> RetentionSummary:
    resolved = _resolve_db_path(db_path)
    conn = get_connection(str(resolved))
    try:
        cutoff = _cutoff_text(days, now_text=now_text)
        summary = _collect_summary(conn, cutoff)
        summary = RetentionSummary(
            days=days,
            cutoff=summary.cutoff,
            notices=summary.notices,
            favorites=summary.favorites,
            min_publish_time=summary.min_publish_time,
            max_publish_time=summary.max_publish_time,
            grouped_rows=summary.grouped_rows,
            applied=False,
        )

        logger.info(
            "Retention cutoff=%s days=%s notices=%s favorites=%s",
            cutoff,
            days,
            summary.notices,
            summary.favorites,
        )
        if summary.grouped_rows:
            for site, category_num, count in summary.grouped_rows:
                logger.info("Candidate group site=%s category=%s count=%s", site, category_num or "-", count)
        if summary.min_publish_time or summary.max_publish_time:
            logger.info(
                "Candidate publish_time range: min=%s max=%s",
                summary.min_publish_time or "-",
                summary.max_publish_time or "-",
            )

        if not apply or summary.notices == 0:
            if not apply:
                logger.info("[DRY-RUN] No rows deleted.")
            return summary

        with conn:
            if _table_exists(conn, "user_favorites"):
                conn.execute(
                    """
                    DELETE FROM user_favorites
                    WHERE target_type = 'bid'
                      AND EXISTS (
                        SELECT 1
                        FROM notices AS n
                        WHERE n.site = user_favorites.target_site
                          AND n.id = user_favorites.target_id
                          AND n.publish_time IS NOT NULL
                          AND n.publish_time != ''
                          AND n.publish_time < ?
                      )
                    """,
                    (cutoff,),
                )

            conn.execute(
                """
                DELETE FROM notices
                WHERE publish_time IS NOT NULL AND publish_time != '' AND publish_time < ?
                """,
                (cutoff,),
            )

        logger.info(
            "Retention applied: deleted notices=%s favorites=%s cutoff=%s",
            summary.notices,
            summary.favorites,
            cutoff,
        )
        return RetentionSummary(
            days=days,
            cutoff=summary.cutoff,
            notices=summary.notices,
            favorites=summary.favorites,
            min_publish_time=summary.min_publish_time,
            max_publish_time=summary.max_publish_time,
            grouped_rows=summary.grouped_rows,
            applied=True,
        )
    finally:
        conn.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Delete notices older than N days and clean dangling bid favorites."
    )
    parser.add_argument("--db", default="notices.db", help="SQLite DB path (relative paths default to data/)")
    parser.add_argument("--days", type=int, default=30, help="Retention window in days.")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually delete rows. Without this flag the command runs in dry-run mode.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    run(args.db, days=args.days, apply=args.apply)


if __name__ == "__main__":
    main()
