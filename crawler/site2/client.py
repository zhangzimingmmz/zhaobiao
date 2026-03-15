import time
import logging
from typing import Dict, Any

from . import config, transport
from .session import generate_sign_headers

logger = logging.getLogger(__name__)

def _build_api_headers(full_url_for_sign: str, referer: str = "https://www.ccgp-sichuan.gov.cn/pay/view/sczc/index") -> Dict[str, str]:
    headers = generate_sign_headers(full_url_for_sign)
    headers["Accept"] = "application/json, text/plain, */*"
    headers["X-Requested-With"] = "XMLHttpRequest"
    headers["Referer"] = referer
    return headers

def fetch_list(session, notice_type: str, start_time: str, end_time: str, curr_page: int, page_size: int) -> Dict[str, Any]:
    """
    Fetch a page of notices for the given time window and type.
    Parameter order matches the captcha-verified request from browser (siteId, channel, _t must be present for correct sign).
    """
    from urllib.parse import urlencode

    timestamp = int(time.time() * 1000)

    # Build params in the same order as the browser's actual request (affects sign computation).
    # Empty-string params are included to match the exact query string the server expects.
    params = [
        ("currPage", str(curr_page)),
        ("pageSize", str(page_size)),
        ("siteId", config.SITE_UUID),
        ("channel", config.CHANNEL_UUID),
        ("noticeType", notice_type),
        ("title", ""),
        ("purchaseManner", ""),
        ("openTenderCode", ""),
        ("purchaser", ""),
        ("agency", ""),
        ("purchaseNature", ""),
        ("operationStartTime", start_time),
        ("operationEndTime", end_time),
        ("verifyCode", getattr(session, "verify_code", "")),
        ("_t", str(timestamp)),
    ]

    query_string = urlencode(params)
    full_url_for_sign = f"{config.LIST_URL}?{query_string}"

    headers = _build_api_headers(full_url_for_sign)

    try:
        data = transport.get_json(
            session,
            config.LIST_URL,
            params=params,
            headers=headers,
            timeout=config.REQUEST_TIMEOUT,
        )

        if data.get("code") == "200" and data.get("data"):
            return {
                "total": data["data"].get("total", 0),
                "rows": data["data"].get("rows", [])
            }
        else:
            logger.warning(f"List API error or empty: {data}")
            return {"total": 0, "rows": []}

    except Exception as e:
        if not transport.is_transport_error(e):
            logger.error(f"Failed to fetch list page: {e}")
            return {"total": 0, "rows": []}
        logger.error(f"Transport error in fetch_list: {e}")
        raise

def probe_total(session, notice_type: str, start_time: str, end_time: str) -> int:
    """
    Probe the total number of records for the given time window.
    """
    result = fetch_list(session, notice_type, start_time, end_time, 1, 1)
    return result.get("total", 0)

def fetch_detail(session, notice_type: str, record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fetch detail based on notice_type. Both detail endpoints use GET.
    """
    import time
    from urllib.parse import urlencode

    timestamp = int(time.time() * 1000)

    if notice_type == "59":
        params = [("id", record.get("id", "")), ("_t", str(timestamp))]
        url = config.DETAIL_URL_59
    elif notice_type == "00101":
        params = [
            ("site", config.SITE_UUID),
            ("planId", record.get("planId", "")),
            ("_t", str(timestamp)),
        ]
        url = config.DETAIL_URL_00101
    else:
        logger.warning(f"Unknown notice_type for detail: {notice_type}")
        return {}

    query_string = urlencode(params)
    full_url_for_sign = f"{url}?{query_string}"
    headers = _build_api_headers(full_url_for_sign)

    try:
        data = transport.get_json(
            session,
            url,
            params=params,
            headers=headers,
            timeout=config.REQUEST_TIMEOUT,
        )

        if data.get("code") == "200" and data.get("data"):
            raw = data["data"]
            # selectInfoByOpenTenderCode 返回 { rows: [...] }，需按 id 匹配
            if notice_type == "00101" and isinstance(raw, dict) and "rows" in raw:
                target_id = record.get("id")
                matched = next((r for r in raw["rows"] if r.get("id") == target_id), None)
                if matched:
                    return matched
                return raw["rows"][0] if raw["rows"] else {}
            return raw
        else:
            logger.warning(f"Detail API error for type {notice_type}, id {record.get('id')}: {data}")
            return {}
    except Exception as e:
        if not transport.is_transport_error(e):
            logger.error(f"Failed to fetch detail for type {notice_type}, id {record.get('id')}: {e}")
            return {}
        logger.error(f"Transport error in fetch_detail for {notice_type}, id {record.get('id')}: {e}")
        raise
