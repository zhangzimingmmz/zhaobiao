from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from . import config


@dataclass
class Site1DetailResult:
    detail_url: str
    title: Optional[str]
    publish_time: Optional[str]
    source_name: Optional[str]
    origin_url: Optional[str]
    content: Optional[str]
    relate_info_id: Optional[str]
    source_info_id: Optional[str]


def build_detail_url(linkurl: str) -> str:
    return urljoin(config.BASE_URL, linkurl)


def parse_detail_page(html: str, detail_url: str) -> Site1DetailResult:
    soup = BeautifulSoup(html, "html.parser")

    title = _text_of(soup.select_one("#title, h2.detailed-title"))
    publish_time = _text_of(soup.select_one("#date"))
    source_name = _text_of(soup.select_one("#source"))

    news_text = soup.select_one("#newsText")
    content = _extract_news_text_content(news_text) if news_text else None
    if content == "":
        content = None

    origin_link = soup.select_one("#originurl_a, #originurl a")
    origin_url = None
    if origin_link is not None:
        origin_url = (origin_link.get("data-value") or origin_link.get("href") or "").strip() or None
        if origin_url and origin_url.lower().startswith("javascript:"):
            origin_url = None

    relate_info_id_node = soup.select_one("#relateinfoid")
    relate_info_id = None
    if relate_info_id_node is not None:
        relate_info_id = (relate_info_id_node.get("data-value") or relate_info_id_node.get_text(strip=True) or "").strip() or None

    source_info_id_node = soup.select_one("#souceinfoid")
    source_info_id = None
    if source_info_id_node is not None:
        source_info_id = (source_info_id_node.get("value") or source_info_id_node.get_text(strip=True) or "").strip() or None

    return Site1DetailResult(
        detail_url=detail_url,
        title=title,
        publish_time=publish_time,
        source_name=source_name,
        origin_url=origin_url,
        content=content,
        relate_info_id=relate_info_id,
        source_info_id=source_info_id,
    )


def merge_list_and_detail_record(list_row: dict[str, Any], detail: Site1DetailResult | None) -> dict[str, Any]:
    merged = dict(list_row)
    raw_json: dict[str, Any] = {"_list": dict(list_row)}

    if detail is not None:
        detail_payload = {
            "detailUrl": detail.detail_url,
            "title": detail.title,
            "publishTime": detail.publish_time,
            "sourceName": detail.source_name,
            "originUrl": detail.origin_url,
            "content": detail.content,
            "relateInfoId": detail.relate_info_id,
            "sourceInfoId": detail.source_info_id,
        }
        raw_json["_detail"] = detail_payload
        if detail.title:
            merged["title"] = detail.title
        if detail.publish_time:
            merged["publish_time"] = detail.publish_time
            merged["webdate"] = detail.publish_time
            merged["info_date"] = detail.publish_time
            merged["infodate"] = detail.publish_time
        if detail.source_name:
            merged["source_name"] = detail.source_name
            merged["zhuanzai"] = detail.source_name
        if detail.origin_url:
            merged["origin_url"] = detail.origin_url
        if detail.content:
            merged["content"] = detail.content

    merged["raw_json"] = raw_json
    return merged


def _text_of(node: Any) -> Optional[str]:
    if node is None:
        return None
    text = node.get_text(" ", strip=True)
    return text or None


def _extract_news_text_content(node: Any) -> Optional[str]:
    raw_html = node.decode_contents().strip()
    if not raw_html:
        return None

    fragment = BeautifulSoup(raw_html, "html.parser")
    body = fragment.body
    if body is not None:
        body_html = body.decode_contents().strip()
        return body_html or None

    html_node = fragment.html
    if html_node is not None:
        html_content = html_node.decode_contents().strip()
        return html_content or None

    return raw_html
