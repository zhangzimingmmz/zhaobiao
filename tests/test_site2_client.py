import unittest
from unittest import mock

from curl_cffi import requests as curl_requests

from crawler.site2 import client, config


class _DummySession:
    def __init__(self, verify_code="2468"):
        self.verify_code = verify_code


class Site2ClientTests(unittest.TestCase):
    @mock.patch.object(client.transport, "get_json")
    @mock.patch.object(client, "generate_sign_headers")
    def test_fetch_list_uses_transport_and_preserves_shape(self, mock_sign_headers, mock_get_json):
        sess = _DummySession()
        mock_sign_headers.return_value = {"sign": "abc", "time": "123", "nsssjss": "xyz"}
        mock_get_json.return_value = {
            "code": "200",
            "data": {
                "total": 5,
                "rows": [{"id": "row-1"}],
            },
        }

        result = client.fetch_list(sess, "59", "2026-03-14 00:00:00", "2026-03-14 23:59:59", 2, 10)

        self.assertEqual(result, {"total": 5, "rows": [{"id": "row-1"}]})
        called_session, called_url = mock_get_json.call_args.args[:2]
        self.assertIs(called_session, sess)
        self.assertEqual(called_url, config.LIST_URL)
        params = mock_get_json.call_args.kwargs["params"]
        self.assertIn(("noticeType", "59"), params)
        self.assertIn(("verifyCode", "2468"), params)
        self.assertEqual(mock_get_json.call_args.kwargs["timeout"], config.REQUEST_TIMEOUT)
        self.assertEqual(
            mock_get_json.call_args.kwargs["headers"]["Referer"],
            "https://www.ccgp-sichuan.gov.cn/pay/view/sczc/index",
        )

    @mock.patch.object(client.transport, "get_json")
    def test_fetch_list_reraises_transport_errors(self, mock_get_json):
        sess = _DummySession()
        mock_get_json.side_effect = curl_requests.exceptions.ProxyError("proxy down")

        with self.assertRaises(curl_requests.exceptions.ProxyError):
            client.fetch_list(sess, "59", "2026-03-14 00:00:00", "2026-03-14 23:59:59", 1, 1)

    @mock.patch.object(client.transport, "get_json")
    @mock.patch.object(client, "generate_sign_headers")
    def test_fetch_detail_matches_00101_row_by_id(self, mock_sign_headers, mock_get_json):
        record = {"id": "keep-me", "planId": "plan-1"}
        mock_sign_headers.return_value = {"sign": "abc", "time": "123", "nsssjss": "xyz"}
        mock_get_json.return_value = {
            "code": "200",
            "data": {
                "rows": [
                    {"id": "other", "content": "ignore"},
                    {"id": "keep-me", "content": "wanted"},
                ]
            },
        }

        detail = client.fetch_detail(_DummySession(), "00101", record)

        self.assertEqual(detail["id"], "keep-me")
        self.assertEqual(detail["content"], "wanted")


if __name__ == "__main__":
    unittest.main()
