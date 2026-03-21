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

    def _insert_notice(
        self,
        notice_id: str,
        *,
        content: str,
        site: str = "site1",
        category_num: str = "002001001",
        description: str = "测试摘要",
    ):
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
                    "categorynum": category_num,
                    "origin_url": "https://example.com/original",
                    "content": content,
                    "description": description,
                    "purchaseNature": "1",
                    "purchaseManner": "1",
                    "purchaser": "测试采购人",
                    "agency": "测试代理机构",
                },
                site,
            )
        finally:
            conn.close()

    def test_site2_bid_detail_sanitizes_html_for_rich_text(self):
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
        self._insert_notice("notice-html", content=raw_html, site="site2_ccgp_sichuan", category_num="00101")

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

    def test_site1_plan_text_is_split_into_readable_paragraphs(self):
        raw_text = (
            "宜宾市高新区市政公共服务数字信息化建设项目（一期）二标段招标计划公告"
            "宜宾市工程建设项目招标计划表拟招标项目名称宜宾市高新区市政公共服务数字信息化建设项目（一期）二标段"
            "招标计划编号5115002026000300项目批准文件关于同意宜宾市高新区市政公共服务数字信息化建设项目（一期）"
            "可行性研究报告（代项目建议书）的批复项目批准文件文号宜高新发改投资〔2024〕78号"
            "招标人宜宾高投资产运营管理有限公司项目所在行政区域宜宾高新区联系人张女士联系方式08315693066"
            "资金来源企业自有资金、专项债券资金项目概况本项目依托已建数据中心算力支持，建设宜宾高新区一体化公共数据平台。"
        )
        self._insert_notice(
            "notice-plan",
            content=raw_text,
            site="site1_sc_ggzyjy",
            category_num="002001009",
        )

        response = self.client.get("/api/detail/bid/notice-plan")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], 200)

        content = response.json()["data"]["content"]
        self.assertIn("<p", content)
        self.assertIn("招标计划编号", content)
        self.assertIn("项目批准文件", content)
        self.assertIn("资金来源", content)
        self.assertIn("项目概况", content)
        self.assertGreaterEqual(content.count("<p"), 4)

    def test_site1_fallback_still_returns_paragraphs_for_unstructured_text(self):
        raw_text = "第一部分 项目概况。第二部分 招标范围。第三部分 联系方式。"
        self._insert_notice("notice-text", content=raw_text, site="site1_sc_ggzyjy", category_num="002001001")

        response = self.client.get("/api/detail/info/notice-text")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], 200)

        content = response.json()["data"]["content"]
        self.assertIn("<p", content)
        self.assertIn("第一部分", content)
        self.assertIn("项目概况。", content)
        self.assertIn("第三部分", content)
        self.assertIn("联系方式。", content)
        self.assertGreaterEqual(content.count("<p"), 3)

    def test_site2_malformed_html_falls_back_to_paragraph_output(self):
        raw_html = "<div><style>.x{color:red;}</style><script>bad()</script> 仅剩纯文本内容 </div>"
        self._insert_notice("notice-fallback", content=raw_html, site="site2_ccgp_sichuan", category_num="59")

        response = self.client.get("/api/detail/info/notice-fallback")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], 200)

        content = response.json()["data"]["content"]
        self.assertIn("<p", content)
        self.assertIn("仅剩纯文本内容", content)
        self.assertNotIn("<script", content)

    def test_site1_html_content_is_rendered_through_html_sanitizer(self):
        raw_html = """
        <div id="newsText">
          <table class="tabList"><tr><td>拟招标项目名称</td><td>测试项目</td></tr></table>
          <p style="color:red;">备注</p>
        </div>
        """
        self._insert_notice(
            "notice-site1-html",
            content=raw_html,
            site="site1_sc_ggzyjy",
            category_num="002001009",
            description="",
        )

        detail_response = self.client.get("/api/detail/bid/notice-site1-html")
        self.assertEqual(detail_response.status_code, 200)
        content = detail_response.json()["data"]["content"]
        self.assertIn("<table", content)
        self.assertIn("border-collapse:collapse", content)
        self.assertNotIn("color:red", content)

        list_response = self.client.get("/api/list?page=1&pageSize=10&category=002001009")
        self.assertEqual(list_response.status_code, 200)
        summary = list_response.json()["data"]["list"][0]["summary"]
        self.assertIn("拟招标项目名称", summary)
        self.assertNotIn("<table", summary)


if __name__ == "__main__":
    unittest.main()
