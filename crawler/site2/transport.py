import logging
from dataclasses import dataclass
from typing import Any, Iterable, Mapping, Optional, Sequence, Tuple

from curl_cffi import requests as curl_requests

from . import config

logger = logging.getLogger(__name__)

CookieEntry = Tuple[str, str, Optional[str]]
_PROXY_ERROR_HINTS = (
    "proxy",
    "connect tunnel",
    "tunnel connection",
    "remote end closed connection without response",
    "remote disconnected",
)


@dataclass
class Site2Session:
    http: Any
    verify_code: str = ""
    created_at: float = 0.0

    @property
    def headers(self):
        return self.http.headers

    @property
    def cookies(self):
        return self.http.cookies

    @property
    def proxies(self):
        return self.http.proxies

    def close(self) -> None:
        close = getattr(self.http, "close", None)
        if callable(close):
            close()


def _default_timeout(timeout: Optional[float]) -> float:
    if timeout is None:
        return getattr(config, "REQUEST_TIMEOUT", 30)
    return timeout


def configure_session(
    session: Site2Session,
    *,
    proxies: Optional[Mapping[str, str]] = None,
    headers: Optional[Mapping[str, str]] = None,
    cookies: Optional[Sequence[CookieEntry]] = None,
) -> Site2Session:
    if headers:
        session.headers.update(dict(headers))
    if proxies:
        session.proxies.update(dict(proxies))
    if cookies:
        for key, value, domain in cookies:
            session.cookies.set(key, value, domain=domain)
    return session


def new_session(
    *,
    proxies: Optional[Mapping[str, str]] = None,
    headers: Optional[Mapping[str, str]] = None,
    cookies: Optional[Sequence[CookieEntry]] = None,
    timeout: Optional[float] = None,
) -> Site2Session:
    http = curl_requests.Session(
        impersonate=getattr(config, "TRANSPORT_IMPERSONATE", "chrome124"),
        verify=False,
        timeout=_default_timeout(timeout),
    )
    session = Site2Session(http=http)
    return configure_session(session, proxies=proxies, headers=headers, cookies=cookies)


def get_response(
    session: Site2Session,
    url: str,
    *,
    params: Optional[Iterable[Tuple[str, str]]] = None,
    headers: Optional[Mapping[str, str]] = None,
    timeout: Optional[float] = None,
):
    return session.http.get(
        url,
        params=params,
        headers=headers,
        timeout=_default_timeout(timeout),
    )


def get_bytes(
    session: Site2Session,
    url: str,
    *,
    params: Optional[Iterable[Tuple[str, str]]] = None,
    headers: Optional[Mapping[str, str]] = None,
    timeout: Optional[float] = None,
) -> bytes:
    response = get_response(session, url, params=params, headers=headers, timeout=timeout)
    response.raise_for_status()
    return response.content


def get_json(
    session: Site2Session,
    url: str,
    *,
    params: Optional[Iterable[Tuple[str, str]]] = None,
    headers: Optional[Mapping[str, str]] = None,
    timeout: Optional[float] = None,
):
    response = get_response(session, url, params=params, headers=headers, timeout=timeout)
    response.raise_for_status()
    return response.json()


def fetch_json(
    url: str,
    *,
    timeout: Optional[float] = None,
    headers: Optional[Mapping[str, str]] = None,
):
    response = curl_requests.get(
        url,
        timeout=_default_timeout(timeout),
        headers=headers,
        impersonate=getattr(config, "TRANSPORT_IMPERSONATE", "chrome124"),
        verify=False,
    )
    response.raise_for_status()
    return response.json()


def is_transport_error(exc: BaseException) -> bool:
    return isinstance(exc, curl_requests.exceptions.RequestException)


def is_proxy_error(exc: BaseException) -> bool:
    if isinstance(exc, curl_requests.exceptions.ProxyError):
        return True

    exc_str = f"{type(exc).__name__}: {exc}".lower()
    if any(keyword.lower() in exc_str for keyword in getattr(config, "PROXY_ERROR_KEYWORDS", [])):
        return True
    return any(hint in exc_str for hint in _PROXY_ERROR_HINTS)
