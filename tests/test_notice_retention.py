import tempfile
import unittest
from pathlib import Path

from crawler.notice_retention import run
from crawler.storage import get_connection, upsert_one


def _insert_favorite(conn, *, user_id: str, target_id: str, target_site: str) -> None:
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS user_favorites (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            target_type TEXT NOT NULL,
            target_id TEXT NOT NULL,
            target_site TEXT,
            created_at TEXT NOT NULL
        )
        """
    )
    conn.execute(
        """
        INSERT INTO user_favorites (id, user_id, target_type, target_id, target_site, created_at)
        VALUES (?, ?, 'bid', ?, ?, '2026-03-22 00:00:00')
        """,
        (f"fav-{target_id}", user_id, target_id, target_site),
    )
    conn.commit()


class NoticeRetentionTests(unittest.TestCase):
    def test_dry_run_reports_candidates_without_writing(self):
        with tempfile.TemporaryDirectory() as tempdir:
            db_path = Path(tempdir) / "notices.db"
            conn = get_connection(db_path)
            try:
                upsert_one(
                    conn,
                    {
                        "id": "old-1",
                        "title": "旧公告",
                        "publish_time": "2026-02-01 10:00:00",
                        "category_num": "002001001",
                    },
                    "site1_sc_ggzyjy",
                )
            finally:
                conn.close()

            summary = run(str(db_path), days=30, now_text="2026-03-22 00:00:00")
            self.assertEqual(summary.notices, 1)
            self.assertEqual(summary.favorites, 0)
            self.assertFalse(summary.applied)

            conn = get_connection(db_path)
            try:
                count = conn.execute("SELECT COUNT(*) FROM notices").fetchone()[0]
            finally:
                conn.close()

            self.assertEqual(count, 1)

    def test_apply_deletes_old_notices_and_related_bid_favorites(self):
        with tempfile.TemporaryDirectory() as tempdir:
            db_path = Path(tempdir) / "notices.db"
            conn = get_connection(db_path)
            try:
                upsert_one(
                    conn,
                    {
                        "id": "old-1",
                        "title": "旧公告",
                        "publish_time": "2026-02-01 10:00:00",
                        "category_num": "002001001",
                    },
                    "site1_sc_ggzyjy",
                )
                upsert_one(
                    conn,
                    {
                        "id": "new-1",
                        "title": "新公告",
                        "publish_time": "2026-03-21 10:00:00",
                        "category_num": "002001001",
                    },
                    "site1_sc_ggzyjy",
                )
                _insert_favorite(conn, user_id="u1", target_id="old-1", target_site="site1_sc_ggzyjy")
                _insert_favorite(conn, user_id="u1", target_id="new-1", target_site="site1_sc_ggzyjy")
            finally:
                conn.close()

            summary = run(
                str(db_path),
                days=30,
                apply=True,
                now_text="2026-03-22 00:00:00",
            )
            self.assertTrue(summary.applied)
            self.assertEqual(summary.notices, 1)
            self.assertEqual(summary.favorites, 1)

            conn = get_connection(db_path)
            try:
                remaining_notices = conn.execute(
                    "SELECT id FROM notices ORDER BY id"
                ).fetchall()
                remaining_favorites = conn.execute(
                    "SELECT target_id FROM user_favorites ORDER BY target_id"
                ).fetchall()
            finally:
                conn.close()

            self.assertEqual([row[0] for row in remaining_notices], ["new-1"])
            self.assertEqual([row[0] for row in remaining_favorites], ["new-1"])

    def test_cutoff_keeps_notice_inside_30_day_window(self):
        with tempfile.TemporaryDirectory() as tempdir:
            db_path = Path(tempdir) / "notices.db"
            conn = get_connection(db_path)
            try:
                upsert_one(
                    conn,
                    {
                        "id": "edge-1",
                        "title": "边界公告",
                        "publish_time": "2026-02-25 00:00:00",
                        "category_num": "002001009",
                    },
                    "site1_sc_ggzyjy",
                )
            finally:
                conn.close()

            summary = run(
                str(db_path),
                days=30,
                now_text="2026-03-22 00:00:00",
            )
            self.assertEqual(summary.notices, 0)


if __name__ == "__main__":
    unittest.main()
