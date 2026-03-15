import tempfile
import unittest
from pathlib import Path

from crawler import storage
from server import main


ROOT = Path(__file__).resolve().parents[1]
MINIAPP_INDEX = ROOT / "miniapp" / "src" / "pages" / "index" / "index.tsx"


class FilterPipelineRegressionTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.tempdir.name) / "notices.db"
        self.original_db_path = main.DB_PATH
        main.DB_PATH = str(self.db_path)

        conn = storage.get_connection(self.db_path)
        try:
            storage.upsert_records(
                conn,
                [
                    {
                        "id": "ga-1",
                        "title": "广安招标公告",
                        "publish_time": "2026-03-15 09:00:00",
                        "source_name": "广安市公共资源交易中心",
                        "tradingsourcevalue": "S015",
                        "category_num": "002001001",
                    },
                    {
                        "id": "sn-1",
                        "title": "遂宁招标公告",
                        "publish_time": "2026-03-15 08:00:00",
                        "source_name": "遂宁市公共资源交易服务中心",
                        "tradingsourcevalue": "S014",
                        "category_num": "002001001",
                    },
                    {
                        "id": "dy-1",
                        "title": "德阳招标公告",
                        "publish_time": "2026-03-15 07:00:00",
                        "source_name": "德阳市公共资源交易中心",
                        "tradingsourcevalue": "S003",
                        "category_num": "002001001",
                    },
                ],
                "site1",
            )
            storage.upsert_records(
                conn,
                [
                    {
                        "id": "goods-1",
                        "title": "货物采购公告",
                        "publish_time": "2026-03-15 09:30:00",
                        "category_num": "00101",
                        "purchase_nature": "1",
                        "region_code": "510100",
                    },
                    {
                        "id": "services-1",
                        "title": "服务采购公告",
                        "publish_time": "2026-03-15 08:30:00",
                        "category_num": "00101",
                        "purchase_nature": "3",
                        "region_code": "510100",
                    },
                    {
                        "id": "goods-2",
                        "title": "货物采购公告-2",
                        "publish_time": "2026-03-15 07:30:00",
                        "category_num": "00101",
                        "purchase_nature": "1",
                        "region_code": "510200",
                    },
                ],
                "site2",
            )
        finally:
            conn.close()

    def tearDown(self) -> None:
        main.DB_PATH = self.original_db_path
        self.tempdir.cleanup()

    def _list_notices(self, **overrides):
        params = {
            "page": 1,
            "pageSize": 10,
            "category": None,
            "keyword": None,
            "timeStart": None,
            "timeEnd": None,
            "regionCode": None,
            "source": None,
            "purchaseManner": None,
            "purchaseNature": None,
            "purchaser": None,
        }
        params.update(overrides)
        return main.list_notices(**params)

    def test_region_code_511600_returns_guangan_records(self) -> None:
        response = self._list_notices(
            category="002001001",
            regionCode="511600",
        )

        self.assertEqual(1, response["data"]["total"])
        self.assertEqual(["ga-1"], [item["id"] for item in response["data"]["list"]])
        self.assertEqual(
            "广安市公共资源交易中心",
            response["data"]["list"][0]["sourceName"],
        )

    def test_source_510900_returns_suining_records(self) -> None:
        response = self._list_notices(
            category="002001001",
            source="510900",
        )

        self.assertEqual(1, response["data"]["total"])
        self.assertEqual(["sn-1"], [item["id"] for item in response["data"]["list"]])
        self.assertEqual(
            "遂宁市公共资源交易服务中心",
            response["data"]["list"][0]["sourceName"],
        )

    def test_purchase_nature_filter_returns_only_goods(self) -> None:
        response = self._list_notices(
            category="00101",
            purchaseNature="1",
        )

        self.assertEqual(2, response["data"]["total"])
        self.assertEqual(
            {"goods-1", "goods-2"},
            {item["id"] for item in response["data"]["list"]},
        )
        self.assertEqual(
            {"1"},
            {item["purchaseNature"] for item in response["data"]["list"]},
        )

    def test_index_build_params_keeps_purchase_nature_binding(self) -> None:
        source = MINIAPP_INDEX.read_text(encoding="utf-8")

        self.assertIn(
            "purchaseNature: filterValues.nature?.code || undefined,",
            source,
        )


if __name__ == "__main__":
    unittest.main()
