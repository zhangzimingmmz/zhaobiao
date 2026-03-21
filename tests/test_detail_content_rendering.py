import importlib
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient

from crawler.storage import upsert_one


class DetailContentRenderingTests(unittest.TestCase):
    def setUp(self):
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "notices.db"
        self.env_patcher = mock.patch.dict(
            os.environ,
            {
                "NOTICES_DB": str(self.db_path),
                "ADMIN_TOKEN": "test-admin-token",
                "ADMIN_PASSWORD": "test-admin-password",
                "JWT_SECRET": "test-jwt-secret",
            },
            clear=False,
        )
        self.env_patcher.start()

        import server.main as server_main

        self.server_main = importlib.reload(server_main)
        self.client = TestClient(self.server_main.app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.env_patcher.stop()
        self.tempdir.cleanup()

    def _insert_notice(self, notice_id: str, *, content: str, site: str = "site1"):
        conn = self.server_main._get_conn()
        try:
            upsert_one(
                conn,
                {
                    "id": notice_id,
                    "title": "正文测试公告",
                    "webdate": "2026-03-21 10:00:00",
                    "zhuanzai": "测试来源",
                    "region_name": "成都市",
                    "region_code": "510100",
                    "categorynum": "002001001",
                    "origin_url": "https://example.com/original",
                    "content": content,
                    "description": "测试摘要",
                    "purchaseNature": "1",
                    "purchaseManner": "1",
                    "purchaser": "测试采购人",
                    "agency": "测试代理机构",
                },
                site,
            )
        finally:
            conn.close()

    def test_bid_detail_sanitizes_html_for_rich_text(self):
        raw_html = """
        <html>
          <body>
            <script>alert('x')</script>
            <div class="wrapper" style="font-size:12px;">
              <p style="text-align:center;color:red;">第一段</p>
              <div><span>第二段</span></div>
              <table style="width:800px">
                <tr><th style="background:#000;color:#fff;">字段</th><td colspan="2">值</td></tr>
              </table>
              <img src="https://cdn.example.com/a.jpg" width="600" />
            </div>
          </body>
        </html>
        """
        self._insert_notice("notice-html", content=raw_html)

        response = self.client.get("/api/detail/bid/notice-html")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], 200)

        content = response.json()["data"]["content"]
        self.assertNotIn("<script", content)
        self.assertNotIn("color:red", content)
        self.assertNotIn("class=", content)
        self.assertIn("line-height:1.9", content)
        self.assertIn("border-collapse:collapse", content)
        self.assertIn('src="https://cdn.example.com/a.jpg"', content)
        self.assertIn("max-width:100%", content)

    def test_info_detail_wraps_plain_text_into_paragraphs(self):
        raw_text = "第一部分 项目概况。\n\n第二部分 招标范围。"
        self._insert_notice("notice-text", content=raw_text, site="site2")

        response = self.client.get("/api/detail/info/notice-text")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], 200)

        content = response.json()["data"]["content"]
        self.assertIn("<p", content)
        self.assertIn("第一部分 项目概况。", content)
        self.assertIn("第二部分 招标范围。", content)
        self.assertGreaterEqual(content.count("<p"), 2)


if __name__ == "__main__":
    unittest.main()
