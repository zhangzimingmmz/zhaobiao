"""
网站一列表接口客户端
- probe_total: 探测单窗口总条数
- fetch_page: 分页拉取列表记录
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

import requests

from . import config

logger = logging.getLogger(__name__)


def _build_body(
    category_id: str,
    start_time: str,
    end_time: str,
    pn: int,
    rn: int,
) -> str:
    """构造请求体 JSON 字符串（与接口文档 1.1.3 一致）。"""
    cat = config.CATEGORIES[category_id]
    body = dict(config.REQUEST_BODY_TEMPLATE)
    body["pn"] = pn
    body["rn"] = rn
    body["condition"] = cat["condition"]
    body["time"] = [
        {
            "fieldName": "webdate",
            "startTime": start_time,
            "endTime": end_time,
        }
    ]
    return json.dumps(body, ensure_ascii=False)


def _post_with_retry(body: str) -> dict[str, Any]:
    """发送 POST 请求，支持重试与退避。返回解析后的 JSON 结果。"""
    last_exc: Exception | None = None
    for attempt in range(1, config.RETRY_TIMES + 1):
        try:
            resp = requests.post(
                config.LIST_URL,
                data=body.encode("utf-8"),
                headers=config.HEADERS,
                timeout=config.REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            return data
        except Exception as exc:
            last_exc = exc
            wait = config.RETRY_BACKOFF ** attempt
            logger.warning(
                "请求失败（第 %d 次，共 %d 次）: %s，等待 %.1fs 后重试",
                attempt,
                config.RETRY_TIMES,
                exc,
                wait,
            )
            if attempt < config.RETRY_TIMES:
                time.sleep(wait)
    raise RuntimeError(f"请求失败，已重试 {config.RETRY_TIMES} 次") from last_exc


def probe_total(category_id: str, start_time: str, end_time: str) -> int:
    """探测时间窗口内的总条数，返回 result.totalcount。

    参数:
        category_id: 如 "002001009"
        start_time:  如 "2026-03-14 00:00:00"
        end_time:    如 "2026-03-14 23:59:59"
    """
    body = _build_body(category_id, start_time, end_time, pn=0, rn=config.PROBE_RN)
    data = _post_with_retry(body)
    return int(data.get("result", {}).get("totalcount", 0))


def fetch_page(
    category_id: str,
    start_time: str,
    end_time: str,
    pn: int,
    rn: int = config.RN,
) -> dict[str, Any]:
    """拉取某页列表数据。

    返回:
        {"totalcount": int, "records": list[dict]}
    """
    body = _build_body(category_id, start_time, end_time, pn=pn, rn=rn)
    data = _post_with_retry(body)
    result = data.get("result", {})
    return {
        "totalcount": int(result.get("totalcount", 0)),
        "records": result.get("records", []),
    }
