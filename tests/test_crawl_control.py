import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from server import crawl_control


class CrawlControlTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "notices.db"
        self.log_dir = Path(self.tempdir.name) / "logs"

    def tearDown(self):
        self.tempdir.cleanup()

    def _list_runs(self):
        return crawl_control.list_runs(self.db_path, limit=20)

    def test_submit_supported_action_creates_queued_run(self):
        run = crawl_control.submit_run_request(
            self.db_path,
            requested_by="admin",
            action_key="site2.precheck",
            params={},
        )

        self.assertEqual(run["status"], "queued")
        self.assertEqual(run["site"], "site2_ccgp_sichuan")
        self.assertEqual(run["triggerSource"], "admin")
        self.assertEqual(len(self._list_runs()), 1)

    def test_denied_action_is_recorded_as_rejected_run(self):
        run = crawl_control.submit_run_request(
            self.db_path,
            requested_by="admin",
            action_key="site2.cleanup",
            params={},
        )

        self.assertEqual(run["status"], "rejected")
        self.assertIn("只允许", run["statusReason"])
        self.assertEqual(len(self._list_runs()), 1)

    def test_invalid_backfill_is_recorded_as_rejected_run(self):
        with mock.patch.object(crawl_control, "BACKFILL_MAX_DAYS", 2):
            run = crawl_control.submit_run_request(
                self.db_path,
                requested_by="admin",
                action_key="site2.backfill",
                params={
                    "start": "2026-03-01",
                    "end": "2026-03-05",
                },
            )

        self.assertEqual(run["status"], "rejected")
        self.assertIn("最多允许 2 天", run["statusReason"])

    def test_second_request_on_same_site_is_rejected_while_first_is_open(self):
        first = crawl_control.submit_run_request(
            self.db_path,
            requested_by="admin",
            action_key="site2.precheck",
            params={},
        )
        second = crawl_control.submit_run_request(
            self.db_path,
            requested_by="admin",
            action_key="site2.incremental",
            params={},
        )

        self.assertEqual(first["status"], "queued")
        self.assertEqual(second["status"], "rejected")
        self.assertIn("已有运行中的或待执行的控制面任务", second["statusReason"])

    def test_recover_orphaned_runs_marks_running_run_failed_and_clears_locks(self):
        crawl_control.submit_run_request(
            self.db_path,
            requested_by="admin",
            action_key="site2.precheck",
            params={},
        )
        claimed = crawl_control.claim_next_run(self.db_path)
        self.assertIsNotNone(claimed)
        self.assertEqual(claimed["status"], "running")

        recovered = crawl_control.recover_orphaned_runs(self.db_path)
        self.assertEqual(recovered, 1)

        run = crawl_control.get_run(self.db_path, claimed["id"])
        self.assertEqual(run["status"], "failed")
        self.assertIn("dispatcher restarted", run["statusReason"])

        conn = sqlite3.connect(self.db_path)
        try:
            lock_count = conn.execute("SELECT COUNT(*) FROM crawl_run_locks").fetchone()[0]
        finally:
            conn.close()
        self.assertEqual(lock_count, 0)

    def test_execute_claimed_run_records_success_summary(self):
        with mock.patch.object(crawl_control, "DEFAULT_LOG_DIR", self.log_dir):
            crawl_control.submit_run_request(
                self.db_path,
                requested_by="admin",
                action_key="site2.incremental",
                params={},
            )
            claimed = crawl_control.claim_next_run(self.db_path)

            def fake_run(command, **kwargs):
                handle = kwargs["stdout"]
                handle.write("2026-03-15 00:00:00 INFO === Site2 incremental complete: fetched=5, upserted=4, errors=0 ===\n")
                handle.flush()
                return mock.Mock(returncode=0)

            with mock.patch.object(crawl_control.subprocess, "run", side_effect=fake_run):
                crawl_control.execute_claimed_run(self.db_path, claimed)

        run = crawl_control.get_run(self.db_path, claimed["id"])
        self.assertEqual(run["status"], "succeeded")
        self.assertEqual(run["fetchedCount"], 5)
        self.assertEqual(run["upsertedCount"], 4)
        self.assertEqual(run["errorCount"], 0)
        self.assertIn("fetched=5", run["summary"])
        self.assertTrue(run["logPath"].endswith(".log"))

    def test_execute_claimed_run_records_failure_summary(self):
        with mock.patch.object(crawl_control, "DEFAULT_LOG_DIR", self.log_dir):
            crawl_control.submit_run_request(
                self.db_path,
                requested_by="admin",
                action_key="site2.precheck",
                params={},
            )
            claimed = crawl_control.claim_next_run(self.db_path)

            def fake_run(command, **kwargs):
                handle = kwargs["stdout"]
                handle.write("fatal: simulated failure\n")
                handle.flush()
                return mock.Mock(returncode=2)

            with mock.patch.object(crawl_control.subprocess, "run", side_effect=fake_run):
                crawl_control.execute_claimed_run(self.db_path, claimed)

        run = crawl_control.get_run(self.db_path, claimed["id"])
        self.assertEqual(run["status"], "failed")
        self.assertIsNotNone(run["statusReason"])
        self.assertEqual(run["exitCode"], 2)


if __name__ == "__main__":
    unittest.main()
