import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from crawler.site1.client import fetch_detail_page
from crawler.site1.detail import merge_list_and_detail_record, parse_detail_page
from crawler.site1.tasks.detail_backfill import run as run_detail_backfill
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


class Site1DetailIngestionTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
