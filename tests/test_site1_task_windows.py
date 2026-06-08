from contextlib import ExitStack
from unittest import TestCase, mock

from crawler.site1.tasks import incremental, recovery


class Site1TaskWindowTests(TestCase):
    def test_incremental_uses_source_timezone_when_now_is_not_supplied(self):
        with ExitStack() as stack:
            stack.enter_context(mock.patch.object(incremental.config, "ALL_CATEGORY_IDS", []))
            window_mock = stack.enter_context(
                mock.patch.object(
                    incremental.windowing,
                    "previous_two_hour_window",
                    return_value=("2026-06-08 08:00:00", "2026-06-08 09:59:59"),
                )
            )
            get_connection = stack.enter_context(
                mock.patch.object(incremental.storage, "get_connection")
            )
            get_connection.return_value.close = mock.Mock()

            incremental.run("/tmp/test.db")

        window_mock.assert_called_once_with(None)

    def test_recovery_uses_source_timezone_when_now_is_not_supplied(self):
        with ExitStack() as stack:
            stack.enter_context(mock.patch.object(recovery.config, "ALL_CATEGORY_IDS", []))
            window_mock = stack.enter_context(
                mock.patch.object(
                    recovery.windowing,
                    "last_48h_windows",
                    return_value=[("2026-06-06 10:00:00", "2026-06-06 11:59:59")],
                )
            )
            get_connection = stack.enter_context(
                mock.patch.object(recovery.storage, "get_connection")
            )
            get_connection.return_value.close = mock.Mock()

            recovery.run("/tmp/test.db")

        window_mock.assert_called_once_with(None)
