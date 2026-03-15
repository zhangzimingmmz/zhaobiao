import unittest
from unittest import mock

from crawler.site2.tasks import core


class _DummySession:
    def __init__(self):
        self.verify_code = "1357"
        self.created_at = 0


class Site2CoreTests(unittest.TestCase):
    @mock.patch.object(core.storage, "upsert_records")
    @mock.patch.object(core.client, "fetch_detail")
    @mock.patch.object(core.client, "fetch_list")
    @mock.patch.object(core.client, "probe_total")
    @mock.patch.object(core.session, "ensure_fresh")
    def test_process_window_supports_logical_session_and_parallel_details(
        self,
        mock_ensure_fresh,
        mock_probe_total,
        mock_fetch_list,
        mock_fetch_detail,
        mock_upsert_records,
    ):
        sess = _DummySession()
        rows = [
            {"id": "row-1", "title": "Title 1", "noticeTime": "2026-03-14 10:00:00"},
            {"id": "row-2", "title": "Title 2", "noticeTime": "2026-03-14 11:00:00"},
        ]

        mock_ensure_fresh.side_effect = lambda current: current or sess
        mock_probe_total.return_value = 2
        mock_fetch_list.return_value = {"total": 2, "rows": rows}
        mock_fetch_detail.side_effect = [
            {"id": "row-1", "content": "Detail 1"},
            {"id": "row-2", "content": "Detail 2"},
        ]
        mock_upsert_records.return_value = 2

        with mock.patch.object(core.config, "DETAIL_PARALLEL_WORKERS", 2), mock.patch.object(
            core.config, "DEFAULT_PAGE_SIZE", 10
        ), mock.patch.object(core.config, "MAX_WINDOW_COUNT", 360):
            stats, returned_sess = core.process_window(
                conn=object(),
                notice_type="59",
                start_time="2026-03-14 00:00:00",
                end_time="2026-03-14 23:59:59",
                sess=sess,
            )

        self.assertEqual(stats, {"fetched": 2, "upserted": 2, "errors": 0})
        self.assertIs(returned_sess, sess)
        self.assertEqual(mock_fetch_detail.call_count, 2)
        for call in mock_fetch_detail.call_args_list:
            self.assertIs(call.args[0], sess)
        mock_upsert_records.assert_called_once()


if __name__ == "__main__":
    unittest.main()
