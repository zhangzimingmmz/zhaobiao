from contextlib import ExitStack
from datetime import datetime, timezone
from pathlib import Path
from unittest import TestCase, mock

from crawler.time_utils import source_date_str, to_source_naive
from crawler.site2.tasks import backfill, precheck, reconcile


class SourceTimeUtilityTests(TestCase):
    def test_to_source_naive_converts_utc_instant_to_beijing_wall_time(self):
        utc_instant = datetime(2026, 6, 7, 16, 30, tzinfo=timezone.utc)

        self.assertEqual(
            to_source_naive(utc_instant),
            datetime(2026, 6, 8, 0, 30),
        )

    def test_source_date_str_uses_beijing_date_for_utc_instant(self):
        utc_instant = datetime(2026, 6, 7, 16, 30, tzinfo=timezone.utc)

        self.assertEqual(source_date_str(utc_instant), "2026-06-08")


class Site2SourceWindowTests(TestCase):
    def test_backfill_formal_default_end_date_uses_source_date(self):
        with mock.patch.object(backfill, "source_date_str", return_value="2026-06-08"):
            self.assertEqual(backfill.default_end_date(), "2026-06-08")

    def test_precheck_expected_end_date_uses_source_date(self):
        with mock.patch.object(precheck, "source_date_str", return_value="2026-06-08"):
            self.assertEqual(precheck.expected_end_date(), "2026-06-08")

    def test_recovery_verification_uses_source_timezone_windows(self):
        windows = [("2026-06-06 10:00:00", "2026-06-06 11:59:59")]
        with ExitStack() as stack:
            window_mock = stack.enter_context(
                mock.patch.object(reconcile, "last_48h_windows", return_value=windows)
            )
            stack.enter_context(
                mock.patch.object(reconcile, "run_window_series", return_value={"fetched": 0})
            )
            stack.enter_context(mock.patch.object(reconcile, "reconcile_date_range", return_value=[]))
            result = reconcile.verify_failure_recovery("/tmp/test.db")

        window_mock.assert_called_once_with(None)
        self.assertTrue(result["passed"])


class TimeUsageGovernanceTests(TestCase):
    def setUp(self):
        self.repo_root = Path(__file__).resolve().parents[1]

    def _files_with_pattern(self, relative_paths, pattern):
        matches = []
        for relative_path in relative_paths:
            root = self.repo_root / relative_path
            for file_path in root.rglob("*"):
                if file_path.suffix not in {".py", ".js", ".jsx", ".ts", ".tsx"}:
                    continue
                text = file_path.read_text(encoding="utf-8")
                for line_no, line in enumerate(text.splitlines(), start=1):
                    if pattern in line:
                        matches.append(f"{file_path.relative_to(self.repo_root)}:{line_no}")
        return matches

    def test_python_production_code_uses_explicit_time_boundaries(self):
        forbidden = {
            "datetime.now()": self._files_with_pattern(["server", "crawler"], "datetime.now()"),
            "datetime.utcnow(": self._files_with_pattern(["server", "crawler"], "datetime.utcnow("),
            "date.today(": self._files_with_pattern(["server", "crawler"], "date.today("),
        }
        offenders = [f"{pattern} at {location}" for pattern, locations in forbidden.items() for location in locations]
        self.assertEqual(offenders, [])

    def test_frontend_pages_do_not_format_time_inline(self):
        allowed = {"admin-frontend/src/lib/time.ts"}
        offenders = []
        for pattern in ("toLocaleString(", "toLocaleDateString(", "toLocaleTimeString("):
            for location in self._files_with_pattern(["admin-frontend/src", "miniapp/src"], pattern):
                if location.rsplit(":", 1)[0] not in allowed:
                    offenders.append(f"{pattern} at {location}")

        self.assertEqual(offenders, [])

    def test_miniapp_pages_do_not_hand_roll_date_parts(self):
        offenders = []
        for pattern in ("getFullYear(", "getMonth(", "getDate("):
            for location in self._files_with_pattern(["miniapp/src/pages"], pattern):
                offenders.append(f"{pattern} at {location}")

        self.assertEqual(offenders, [])
