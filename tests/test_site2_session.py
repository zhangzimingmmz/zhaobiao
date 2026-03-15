import unittest
from unittest import mock

from curl_cffi import requests as curl_requests

from crawler.site2 import config, session


class _DummyCookies:
    def __init__(self):
        self.entries = []

    def set(self, key, value, domain=None):
        self.entries.append((key, value, domain))


class _DummyHttp:
    def __init__(self):
        self.headers = {}
        self.proxies = {}
        self.cookies = _DummyCookies()
        self.closed = False

    def close(self):
        self.closed = True


class _DummySession:
    def __init__(self):
        self.http = _DummyHttp()
        self.verify_code = ""
        self.created_at = 0

    @property
    def headers(self):
        return self.http.headers

    @property
    def proxies(self):
        return self.http.proxies

    @property
    def cookies(self):
        return self.http.cookies

    @property
    def closed(self):
        return self.http.closed

    def close(self):
        self.http.close()


class Site2SessionTests(unittest.TestCase):
    @mock.patch.object(session, "solve_captcha")
    @mock.patch.object(session, "get_fresh_proxy")
    @mock.patch.object(session.transport, "new_session")
    def test_create_session_retries_full_bootstrap_on_captcha_failure(
        self,
        mock_new_session,
        mock_get_fresh_proxy,
        mock_solve_captcha,
    ):
        created_sessions = []

        def build_dummy_session(*, proxies=None, **kwargs):
            sess = _DummySession()
            if proxies:
                sess.proxies.update(proxies)
            created_sessions.append(sess)
            return sess

        mock_new_session.side_effect = build_dummy_session
        mock_get_fresh_proxy.side_effect = [
            {"http": "http://proxy-1", "https": "http://proxy-1"},
            {"http": "http://proxy-2", "https": "http://proxy-2"},
        ]
        mock_solve_captcha.side_effect = [Exception("captcha failed"), "1234"]

        with mock.patch.object(config, "SESSION_BOOTSTRAP_RETRIES", 2), mock.patch.object(
            config, "RETRY_BACKOFF_FACTOR", 0
        ):
            sess = session.create_session()

        self.assertIs(sess, created_sessions[1])
        self.assertTrue(created_sessions[0].closed)
        self.assertEqual(sess.verify_code, "1234")
        self.assertIn(("regionCode", "510001", "www.ccgp-sichuan.gov.cn"), sess.cookies.entries)
        self.assertEqual(created_sessions[0].proxies["http"], "http://proxy-1")
        self.assertEqual(created_sessions[1].proxies["http"], "http://proxy-2")

    @mock.patch.object(session, "_fetch_captcha_bytes")
    @mock.patch.object(session.ddddocr, "DdddOcr")
    def test_solve_captcha_rotates_immediately_on_proxy_error(self, mock_ocr_cls, mock_fetch_captcha_bytes):
        sess = _DummySession()
        mock_ocr_cls.return_value = mock.Mock()
        mock_fetch_captcha_bytes.side_effect = curl_requests.exceptions.ProxyError("proxy down")

        with mock.patch.object(config, "RETRY_BACKOFF_FACTOR", 0):
            with self.assertRaises(curl_requests.exceptions.ProxyError):
                session.solve_captcha(sess)

        mock_fetch_captcha_bytes.assert_called_once()

    @mock.patch.object(session, "_fetch_captcha_bytes")
    @mock.patch.object(session.transport, "fetch_json")
    @mock.patch.object(session.transport, "new_session")
    def test_get_fresh_proxy_skips_bad_proxy_candidates(
        self,
        mock_new_session,
        mock_fetch_json,
        mock_fetch_captcha_bytes,
    ):
        extracted = ["bad-proxy:1", "good-proxy:2"]
        created_sessions = []

        def build_dummy_session(*, proxies=None, **kwargs):
            sess = _DummySession()
            if proxies:
                sess.proxies.update(proxies)
            created_sessions.append(sess)
            return sess

        mock_new_session.side_effect = build_dummy_session
        mock_fetch_json.side_effect = [
            {"code": "SUCCESS", "data": [{"server": extracted.pop(0)}]},
            {"code": "SUCCESS", "data": [{"server": extracted.pop(0)}]},
        ]
        mock_fetch_captcha_bytes.side_effect = [
            curl_requests.exceptions.ProxyError("bad proxy"),
            b"captcha",
        ]

        with mock.patch.object(config, "PROXY_EXTRACT_ATTEMPTS", 2), mock.patch.object(
            config, "PROXY_USER", "proxy-user"
        ), mock.patch.object(config, "PROXY_PASS", "proxy-pass"):
            proxy = session.get_fresh_proxy()

        self.assertEqual(proxy["http"], "http://proxy-user:proxy-pass@good-proxy:2")
        self.assertTrue(created_sessions[0].closed)
        self.assertTrue(created_sessions[1].closed)

    @mock.patch.object(session.transport, "get_bytes")
    def test_fetch_captcha_bytes_uses_transport(self, mock_get_bytes):
        sess = _DummySession()
        mock_get_bytes.return_value = b"captcha"

        captcha_bytes = session._fetch_captcha_bytes(sess, "https://example.com/captcha")

        self.assertEqual(captcha_bytes, b"captcha")
        mock_get_bytes.assert_called_once_with(sess, "https://example.com/captcha", timeout=30)


if __name__ == "__main__":
    unittest.main()
