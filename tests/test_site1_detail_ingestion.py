import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from crawler.site1.client import fetch_detail_page
from crawler.site1.detail import merge_list_and_detail_record, parse_detail_page
from crawler.site1.tasks.detail_backfill import (
    _normalize_categories,
    run as run_detail_backfill,
    run_with_stats,
)
from crawler.storage import get_connection, upsert_one


SITE1_PLAN_HTML = """
<html><body>
  <h2 id="title">测试招标计划公告</h2>
  <span id="relateinfoid" data-value="5115002026000300"></span>
  <p class="detailed-desc">发布时间：<span id="date">2026-03-20 20:25:14</span> 来源：<span id="source">宜宾市公共资源交易中心</span><span id="originurl"><a id="originurl_a" data-value="https://ggzy.yibin.gov.cn/detail?id=1" href="javascript:void(0)">原文链接</a></span></p>
  <div id="newsText"><table class="tabList"><tr><td>拟招标项目名称</td><td>测试项目</td></tr></table><p>备注说明</p></div>
  <input type="hidden" id="souceinfoid" value="A7C61921-3E52-4F6B-BFC8-172E23699D7D" />
</body></html>
"""


SITE1_NESTED_DOCUMENT_HTML = """
<html><body>
  <h2 id="title">测试嵌套正文公告</h2>
  <div id="newsText"><!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><style>.x{color:red;}</style></head><body><div class="wmain"><p>正文第一段</p><table><tr><td>字段</td><td>值</td></tr></table></div></body></html></div>
</body></html>
"""


class Site1DetailIngestionTests(unittest.TestCase):
    def test_normalize_categories_defaults_to_three_category_order(self):
        self.assertEqual(
            _normalize_categories(None),
            ["002001009", "002001001", "002002001"],
        )

    def test_parse_detail_page_extracts_embedded_fields(self):
        detail = parse_detail_page(
            SITE1_PLAN_HTML,
            "https://ggzyjy.sc.gov.cn/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
        )
        self.assertEqual(detail.title, "测试招标计划公告")
        self.assertEqual(detail.publish_time, "2026-03-20 20:25:14")
        self.assertEqual(detail.source_name, "宜宾市公共资源交易中心")
        self.assertEqual(detail.origin_url, "https://ggzy.yibin.gov.cn/detail?id=1")
        self.assertIn("<table", detail.content or "")
        self.assertEqual(detail.relate_info_id, "5115002026000300")
        self.assertEqual(detail.source_info_id, "A7C61921-3E52-4F6B-BFC8-172E23699D7D")

    def test_merge_list_and_detail_prefers_detail_content(self):
        merged = merge_list_and_detail_record(
            {
                "id": "002001009A7C61921-3E52-4F6B-BFC8-172E23699D7D_001",
                "title": "列表标题",
                "webdate": "2026-03-20 20:25:14",
                "categorynum": "002001009",
                "linkurl": "/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
                "content": "列表层压平文本",
            },
            parse_detail_page(SITE1_PLAN_HTML, "https://ggzyjy.sc.gov.cn/detail.html"),
        )
        self.assertIn("<table", merged["content"])
        self.assertEqual(merged["origin_url"], "https://ggzy.yibin.gov.cn/detail?id=1")
        self.assertIn("_list", merged["raw_json"])
        self.assertIn("_detail", merged["raw_json"])

    def test_parse_detail_page_unwraps_nested_html_document_from_news_text(self):
        detail = parse_detail_page(
            SITE1_NESTED_DOCUMENT_HTML,
            "https://ggzyjy.sc.gov.cn/detail-nested.html",
        )
        self.assertNotIn("<html", detail.content or "")
        self.assertNotIn("<body", detail.content or "")
        self.assertIn("<div class=\"wmain\">", detail.content or "")
        self.assertIn("<table>", detail.content or "")
        self.assertIn("正文第一段", detail.content or "")

    @mock.patch("crawler.site1.client.requests.get")
    def test_fetch_detail_page_requests_absolute_detail_url(self, mock_get):
        mock_response = mock.Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.encoding = "utf-8"
        mock_response.text = SITE1_PLAN_HTML
        mock_get.return_value = mock_response

        detail = fetch_detail_page(
            {
                "id": "notice-1",
                "linkurl": "/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
            }
        )

        self.assertEqual(detail.title, "测试招标计划公告")
        called_url = mock_get.call_args.args[0]
        self.assertEqual(
            called_url,
            "https://ggzyjy.sc.gov.cn/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
        )

    @mock.patch("crawler.site1.client.requests.get")
    def test_fetch_detail_page_forces_utf8_to_avoid_mojibake(self, mock_get):
        html_bytes = SITE1_PLAN_HTML.encode("utf-8")
        mock_response = mock.Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.encoding = "ISO-8859-1"
        type(mock_response).text = property(lambda self: html_bytes.decode(self.encoding, errors="replace"))
        mock_get.return_value = mock_response

        detail = fetch_detail_page(
            {
                "id": "notice-utf8",
                "linkurl": "/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
            }
        )

        self.assertEqual(detail.title, "测试招标计划公告")
        self.assertIn("测试项目", detail.content or "")

    @mock.patch("crawler.site1.client.requests.get")
    def test_detail_backfill_merges_existing_site1_record(self, mock_get):
        mock_response = mock.Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.encoding = "utf-8"
        mock_response.text = SITE1_PLAN_HTML
        mock_get.return_value = mock_response

        with tempfile.TemporaryDirectory() as tempdir:
            db_path = Path(tempdir) / "notices.db"
            conn = get_connection(db_path)
            try:
                upsert_one(
                    conn,
                    {
                        "id": "002001009A7C61921-3E52-4F6B-BFC8-172E23699D7D_001",
                        "title": "列表标题",
                        "webdate": "2026-03-20 20:25:14",
                        "zhuanzai": "宜宾市公共资源交易中心",
                        "categorynum": "002001009",
                        "linkurl": "/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
                        "content": "列表层压平文本",
                        "raw_json": json.dumps(
                            {
                                "id": "002001009A7C61921-3E52-4F6B-BFC8-172E23699D7D_001",
                                "title": "列表标题",
                                "webdate": "2026-03-20 20:25:14",
                                "categorynum": "002001009",
                                "linkurl": "/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
                                "content": "列表层压平文本",
                            },
                            ensure_ascii=False,
                        ),
                    },
                    "site1_sc_ggzyjy",
                )
            finally:
                conn.close()

            saved = run_detail_backfill(str(db_path), category="002001009", limit=10)
            self.assertEqual(saved, 1)

            conn = get_connection(db_path)
            try:
                row = conn.execute(
                    "SELECT content, origin_url, raw_json FROM notices WHERE site = ? AND id = ?",
                    ("site1_sc_ggzyjy", "002001009A7C61921-3E52-4F6B-BFC8-172E23699D7D_001"),
                ).fetchone()
            finally:
                conn.close()

            self.assertIn("<table", row["content"])
            self.assertEqual(row["origin_url"], "https://ggzy.yibin.gov.cn/detail?id=1")
            raw_json = json.loads(row["raw_json"])
            self.assertIn("_list", raw_json)
            self.assertIn("_detail", raw_json)

    @mock.patch("crawler.site1.tasks.detail_backfill.time.sleep")
    @mock.patch("crawler.site1.client.requests.get")
    def test_detail_backfill_dry_run_collects_stats_without_writing(self, mock_get, mock_sleep):
        mock_response = mock.Mock()
        mock_response.raise_for_status.return_value = None
        mock_response.encoding = "utf-8"
        mock_response.text = SITE1_PLAN_HTML
        mock_get.return_value = mock_response

        with tempfile.TemporaryDirectory() as tempdir:
            db_path = Path(tempdir) / "notices.db"
            conn = get_connection(db_path)
            try:
                upsert_one(
                    conn,
                    {
                        "id": "002001009A7C61921-3E52-4F6B-BFC8-172E23699D7D_001",
                        "title": "列表标题",
                        "webdate": "2026-03-20 20:25:14",
                        "categorynum": "002001009",
                        "linkurl": "/jyxx/002001/002001009/20260320/A7C61921-3E52-4F6B-BFC8-172E23699D7D.html",
                        "content": "列表层压平文本",
                    },
                    "site1_sc_ggzyjy",
                )
            finally:
                conn.close()

            stats = run_with_stats(
                db_path=str(db_path),
                categories=["002001009"],
                batch_size=10,
                sleep_seconds=0.0,
                dry_run=True,
            )
            self.assertEqual(stats.saved, 0)
            self.assertEqual(stats.categories[0].succeeded, 1)
            self.assertEqual(stats.categories[0].candidates, 1)

            conn = get_connection(db_path)
            try:
                row = conn.execute(
                    "SELECT content, origin_url, raw_json FROM notices WHERE site = ? AND id = ?",
                    ("site1_sc_ggzyjy", "002001009A7C61921-3E52-4F6B-BFC8-172E23699D7D_001"),
                ).fetchone()
            finally:
                conn.close()

            self.assertEqual(row["content"], "列表层压平文本")
            self.assertIsNone(row["origin_url"])
            self.assertNotIn("_detail", row["raw_json"] or "")

    @mock.patch("crawler.site1.tasks.detail_backfill.time.sleep")
    @mock.patch("crawler.site1.client.fetch_detail_page")
    def test_detail_backfill_runs_categories_in_expected_order(self, mock_fetch_detail_page, mock_sleep):
        mock_fetch_detail_page.side_effect = lambda record: parse_detail_page(
            SITE1_PLAN_HTML.replace("测试招标计划公告", record["title"]),
            f"https://ggzyjy.sc.gov.cn{record['linkurl']}",
        )

        with tempfile.TemporaryDirectory() as tempdir:
            db_path = Path(tempdir) / "notices.db"
            conn = get_connection(db_path)
            try:
                for category in ("002001009", "002001001", "002002001"):
                    upsert_one(
                        conn,
                        {
                            "id": f"{category}_1",
                            "title": f"{category} 标题",
                            "webdate": "2026-03-20 20:25:14",
                            "categorynum": category,
                            "linkurl": f"/jyxx/002001/{category}/20260320/{category}.html",
                            "content": "列表层压平文本",
                        },
                        "site1_sc_ggzyjy",
                    )
            finally:
                conn.close()

            stats = run_with_stats(
                db_path=str(db_path),
                batch_size=1,
                sleep_seconds=0.0,
            )
            self.assertEqual(
                [item.category for item in stats.categories],
                ["002001009", "002001001", "002002001"],
            )
            self.assertEqual(stats.saved, 3)
            self.assertEqual(mock_fetch_detail_page.call_count, 3)


if __name__ == "__main__":
    unittest.main()
