import importlib
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

from fastapi.testclient import TestClient

from crawler.storage import upsert_one


class FavoritesApiTests(unittest.TestCase):
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
        self.user_headers = self._create_user_headers()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        self.env_patcher.stop()
        self.tempdir.cleanup()

    def _create_user_headers(self):
        register_response = self.client.post(
            "/api/auth/register",
            json={
                "username": "favorite-user",
                "password": "password123",
                "mobile": "13800000000",
                "creditCode": "91510100MA6C123456",
                "legalPersonName": "测试法人",
                "legalPersonPhone": "13800000001",
                "businessScope": "测试服务",
                "businessAddress": "成都市金堂县测试地址",
                "companyName": "测试企业",
            },
        )
        self.assertEqual(register_response.status_code, 200)
        application_id = register_response.json()["data"]["applicationId"]

        approve_response = self.client.post(
            f"/api/admin/reviews/{application_id}/approve",
            headers=self.admin_headers,
            json={},
        )
        self.assertEqual(approve_response.status_code, 200)
        self.assertEqual(approve_response.json()["code"], 200)

        login_response = self.client.post(
            "/api/auth/login",
            json={"username": "favorite-user", "password": "password123"},
        )
        self.assertEqual(login_response.status_code, 200)
        self.assertEqual(login_response.json()["code"], 200)
        token = login_response.json()["data"]["token"]
        return {"Authorization": f"Bearer {token}"}

    def _insert_notice(self, notice_id: str, *, site: str, category_num: str = "002001001", title: str = "测试公告"):
        conn = self.server_main._get_conn()
        try:
            upsert_one(
                conn,
                {
                    "id": notice_id,
                    "title": title,
                    "webdate": "2026-03-20 10:00:00",
                    "zhuanzai": "测试来源",
                    "region_name": "成都市",
                    "region_code": "510100",
                    "categorynum": category_num,
                    "origin_url": "https://example.com/original",
                    "content": "<p>正文</p>",
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

    def _create_published_article(self, article_id: str = "article-1"):
        create_response = self.client.post(
            "/api/admin/articles",
            headers=self.admin_headers,
            json={
                "title": "测试文章",
                "summary": "文章摘要",
                "coverImageUrl": "https://cdn.example.com/cover.jpg",
                "wechatArticleUrl": f"https://mp.weixin.qq.com/s/{article_id}",
                "category": "company_news",
                "sortOrder": 0,
            },
        )
        self.assertEqual(create_response.status_code, 200)
        self.assertEqual(create_response.json()["code"], 200)
        created_id = create_response.json()["data"]["id"]
        publish_response = self.client.post(
            f"/api/admin/articles/{created_id}/publish",
            headers=self.admin_headers,
            json={},
        )
        self.assertEqual(publish_response.status_code, 200)
        self.assertEqual(publish_response.json()["code"], 200)
        return created_id

    def test_toggle_requires_authentication(self):
        response = self.client.post(
            "/api/favorites/toggle",
            json={"targetId": "notice-1", "targetType": "bid", "targetSite": "site1"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["detail"]["code"], 401)

    def test_toggle_and_status_for_bid_and_article(self):
        self._insert_notice("notice-1", site="site1", title="工程公告")
        article_id = self._create_published_article()

        bid_toggle = self.client.post(
            "/api/favorites/toggle",
            headers=self.user_headers,
            json={"targetId": "notice-1", "targetType": "bid", "targetSite": "site1"},
        )
        self.assertEqual(bid_toggle.status_code, 200)
        self.assertTrue(bid_toggle.json()["data"]["favorited"])

        duplicate_toggle = self.client.post(
            "/api/favorites/toggle",
            headers=self.user_headers,
            json={"targetId": "notice-1", "targetType": "bid", "targetSite": "site1"},
        )
        self.assertEqual(duplicate_toggle.status_code, 200)
        self.assertFalse(duplicate_toggle.json()["data"]["favorited"])

        third_toggle = self.client.post(
            "/api/favorites/toggle",
            headers=self.user_headers,
            json={"targetId": "notice-1", "targetType": "bid", "targetSite": "site1"},
        )
        self.assertTrue(third_toggle.json()["data"]["favorited"])

        info_toggle = self.client.post(
            "/api/favorites/toggle",
            headers=self.user_headers,
            json={"targetId": article_id, "targetType": "info"},
        )
        self.assertEqual(info_toggle.status_code, 200)
        self.assertTrue(info_toggle.json()["data"]["favorited"])

        list_response = self.client.get(
            "/api/list?page=1&pageSize=10&category=002001001",
            headers=self.user_headers,
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertTrue(list_response.json()["data"]["list"][0]["favorited"])

        detail_response = self.client.get(
            "/api/detail/bid/notice-1",
            headers=self.user_headers,
        )
        self.assertEqual(detail_response.status_code, 200)
        self.assertTrue(detail_response.json()["data"]["favorited"])
        self.assertEqual(detail_response.json()["data"]["site"], "site1")

        article_list_response = self.client.get("/api/articles?page=1&pageSize=10", headers=self.user_headers)
        self.assertEqual(article_list_response.status_code, 200)
        self.assertTrue(article_list_response.json()["data"]["list"][0]["favorited"])

        article_detail_response = self.client.get(f"/api/articles/{article_id}", headers=self.user_headers)
        self.assertEqual(article_detail_response.status_code, 200)
        self.assertTrue(article_detail_response.json()["data"]["favorited"])

    def test_favorites_list_filters_disappeared_source_records(self):
        self._insert_notice("notice-keep", site="site1", title="保留公告")
        self._insert_notice("notice-drop", site="site2", title="待删除公告")
        article_id = self._create_published_article("article-keep")

        for payload in (
            {"targetId": "notice-keep", "targetType": "bid", "targetSite": "site1"},
            {"targetId": "notice-drop", "targetType": "bid", "targetSite": "site2"},
            {"targetId": article_id, "targetType": "info"},
        ):
            response = self.client.post("/api/favorites/toggle", headers=self.user_headers, json=payload)
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.json()["data"]["favorited"])

        conn = self.server_main._get_conn()
        try:
            conn.execute("DELETE FROM notices WHERE site = ? AND id = ?", ("site2", "notice-drop"))
            conn.commit()
        finally:
            conn.close()

        favorites_response = self.client.get("/api/favorites?page=1&pageSize=10", headers=self.user_headers)
        self.assertEqual(favorites_response.status_code, 200)
        body = favorites_response.json()
        self.assertEqual(body["code"], 200)
        self.assertEqual(body["data"]["total"], 2)
        ids = {(item["viewType"], item["id"]) for item in body["data"]["list"]}
        self.assertIn(("bid", "notice-keep"), ids)
        self.assertIn(("info", article_id), ids)
        self.assertNotIn(("bid", "notice-drop"), ids)


if __name__ == "__main__":
    unittest.main()
