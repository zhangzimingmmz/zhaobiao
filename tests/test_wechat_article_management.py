import importlib
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient


class WechatArticleManagementTests(unittest.TestCase):
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
        self.admin_headers = {"Authorization": "Bearer test-admin-token"}

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.env_patcher.stop()
        self.tempdir.cleanup()

    def _create_article(self, **overrides):
        payload = {
            "title": "测试文章",
            "summary": "测试摘要",
            "coverImageUrl": "https://cdn.example.com/cover.jpg",
            "wechatArticleUrl": "https://mp.weixin.qq.com/s/test-article",
            "category": "company_news",
            "sortOrder": 0,
        }
        payload.update(overrides)
        response = self.client.post("/api/admin/articles", headers=self.admin_headers, json=payload)
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["code"], 200)
        return body["data"]

    def _publish_article(self, article_id: str):
        response = self.client.post(
            f"/api/admin/articles/{article_id}/publish",
            headers=self.admin_headers,
            json={},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["code"], 200)

    def test_validate_duplicate_and_lifecycle_flow(self):
        with mock.patch.object(
            self.server_main,
            "extract_article_info",
            return_value={
                "valid": True,
                "title": "提取标题",
                "cover": "https://cdn.example.com/extracted.jpg",
                "summary": "自动提取摘要",
            },
        ):
            validate_response = self.client.post(
                "/api/admin/articles/validate-url",
                headers=self.admin_headers,
                json={"url": "https://mp.weixin.qq.com/s/test-article"},
            )

        self.assertEqual(validate_response.status_code, 200)
        self.assertEqual(
            validate_response.json()["data"]["title"],
            "提取标题",
        )

        duplicate_before = self.client.post(
            "/api/admin/articles/check-duplicate",
            headers=self.admin_headers,
            json={"url": "https://mp.weixin.qq.com/s/test-article"},
        )
        self.assertEqual(duplicate_before.status_code, 200)
        self.assertFalse(duplicate_before.json()["data"]["exists"])

        created = self._create_article()
        article_id = created["id"]
        self.assertEqual(created["status"], "draft")

        duplicate_after = self.client.post(
            "/api/admin/articles/check-duplicate",
            headers=self.admin_headers,
            json={"url": "https://mp.weixin.qq.com/s/test-article"},
        )
        self.assertTrue(duplicate_after.json()["data"]["exists"])

        updated = self.client.put(
            f"/api/admin/articles/{article_id}",
            headers=self.admin_headers,
            json={
                "title": "更新后的文章",
                "summary": "更新后的摘要",
                "sortOrder": 9,
                "category": "policy",
            },
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["data"]["title"], "更新后的文章")
        self.assertEqual(updated.json()["data"]["sortOrder"], 9)

        self._publish_article(article_id)

        miniapp_list = self.client.get("/api/articles?page=1&pageSize=10")
        self.assertEqual(miniapp_list.status_code, 200)
        self.assertEqual(miniapp_list.json()["code"], 200)
        self.assertEqual(miniapp_list.json()["data"]["total"], 1)
        self.assertEqual(miniapp_list.json()["data"]["list"][0]["id"], article_id)

        miniapp_detail = self.client.get(f"/api/articles/{article_id}")
        self.assertEqual(miniapp_detail.status_code, 200)
        self.assertEqual(miniapp_detail.json()["data"]["title"], "更新后的文章")

        view_response = self.client.post(f"/api/articles/{article_id}/view", json={})
        self.assertEqual(view_response.status_code, 200)
        self.assertEqual(view_response.json()["code"], 200)

        admin_detail = self.client.get(
            f"/api/admin/articles/{article_id}",
            headers=self.admin_headers,
        )
        self.assertEqual(admin_detail.status_code, 200)
        self.assertEqual(admin_detail.json()["data"]["viewCount"], 1)

        logs_response = self.client.get(
            f"/api/admin/articles/{article_id}/logs",
            headers=self.admin_headers,
        )
        operations = [item["operation"] for item in logs_response.json()["data"]["list"]]
        self.assertIn("create", operations)
        self.assertIn("update", operations)
        self.assertIn("publish", operations)

        unpublish = self.client.post(
            f"/api/admin/articles/{article_id}/unpublish",
            headers=self.admin_headers,
            json={},
        )
        self.assertEqual(unpublish.status_code, 200)
        self.assertEqual(unpublish.json()["data"]["status"], "draft")

        hidden_detail = self.client.get(f"/api/articles/{article_id}")
        self.assertEqual(hidden_detail.status_code, 200)
        self.assertEqual(hidden_detail.json()["code"], 404)

    def test_admin_filters_pagination_and_sort_order(self):
        created_top = self._create_article(
            title="置顶文章",
            wechatArticleUrl="https://mp.weixin.qq.com/s/top-article",
            category="company_news",
            sortOrder=10,
        )
        created_policy = self._create_article(
            title="政策法规文章",
            wechatArticleUrl="https://mp.weixin.qq.com/s/policy-article",
            category="policy",
            sortOrder=0,
        )
        created_other = self._create_article(
            title="普通文章",
            wechatArticleUrl="https://mp.weixin.qq.com/s/other-article",
            category="other",
            sortOrder=1,
        )

        for article_id in (created_top["id"], created_policy["id"], created_other["id"]):
            self._publish_article(article_id)

        admin_filtered = self.client.get(
            "/api/admin/articles?page=1&pageSize=1&status=published&category=policy&keyword=政策",
            headers=self.admin_headers,
        )
        self.assertEqual(admin_filtered.status_code, 200)
        self.assertEqual(admin_filtered.json()["data"]["total"], 1)
        self.assertEqual(admin_filtered.json()["data"]["list"][0]["id"], created_policy["id"])

        first_page = self.client.get("/api/articles?page=1&pageSize=2")
        second_page = self.client.get("/api/articles?page=2&pageSize=2")
        self.assertEqual(first_page.status_code, 200)
        self.assertEqual(second_page.status_code, 200)
        self.assertEqual(first_page.json()["data"]["total"], 3)
        self.assertEqual(len(first_page.json()["data"]["list"]), 2)
        self.assertEqual(len(second_page.json()["data"]["list"]), 1)

        first_ids = [item["id"] for item in first_page.json()["data"]["list"]]
        self.assertEqual(first_ids[0], created_top["id"])
        self.assertEqual(first_ids[1], created_other["id"])


if __name__ == "__main__":
    unittest.main()
