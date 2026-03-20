# 公告列表与详情 API，从 notices 表读取并按《接口文档-前端与小程序》映射字段
# 运行：在项目根目录执行 PYTHONPATH=. uvicorn server.main:app --reload

from __future__ import annotations

import base64
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from urllib.parse import urlparse
from pathlib import Path
from typing import Any, Optional

import requests

# 保证项目根在 path，以便 import crawler.storage
_root = Path(__file__).resolve().parent.parent
if str(_root) not in sys.path:
    sys.path.insert(0, str(_root))

import sqlite3

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field

from server import crawl_control
from server.auth_utils import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)

app = FastAPI(title="招投标公告 API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# 数据库路径：环境变量 NOTICES_DB 或默认项目根 data/notices.db
DB_PATH = os.environ.get("NOTICES_DB", str(_root / "data" / "notices.db"))

# 管理员认证：环境变量 ADMIN_TOKEN 或默认值（仅用于开发/内网环境）
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "admin-secret-token-change-in-production")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123456")

# 站点 Base URL，拼装 originUrl 用
SITE1_BASE = "https://ggzyjy.sc.gov.cn"
SITE2_BASE = "https://www.ccgp-sichuan.gov.cn"

# 微信业务域名校验文件目录（用于 web-view 加载代理页）
WX_VERIFY_DIR = Path(os.environ.get("WX_VERIFY_DIR", str(_root / "wx_verify")))

# S-code ↔ 行政区划代码映射（基于 site1 实际 source_name 对应关系）
# tradingsourcevalue (site1) ↔ 市级行政区划代码 (前端/ site2 region_code 前缀)
_S_TO_REGION: dict[str, str] = {
    "S001": "510100",  # 四川省公共资源交易平台（成都）
    "S002": "510100",  # 成都市
    "S003": "510600",  # 德阳市
    "S004": "510700",  # 绵阳市
    "S005": "511000",  # 内江市
    "S006": "511100",  # 乐山市
    "S007": "510800",  # 广元市
    "S008": "511400",  # 眉山市
    "S009": "510300",  # 自贡市
    "S010": "511800",  # 雅安市
    "S011": "511500",  # 宜宾市
    "S012": "510400",  # 攀枝花市
    "S013": "510500",  # 泸州市
    "S014": "510900",  # 遂宁市
    "S015": "511600",  # 广安市
    "S016": "511300",  # 南充市
    "S017": "511700",  # 达州市
    "S018": "512000",  # 资阳市
    "S019": "511900",  # 巴中市
    "S020": "513200",  # 阿坝州
    "S021": "513300",  # 甘孜州
    "S022": "513400",  # 凉山州
}


def _region_to_s_codes(region_code: str) -> list[str]:
    """行政区划 code → S-code 列表，供 site1 tradingsourcevalue 匹配。"""
    return [s for s, r in _S_TO_REGION.items() if r == region_code]


def _is_s_code(value: str) -> bool:
    """判断是否为 S-code（如 S001、S020）。"""
    return bool(value) and value.startswith("S") and len(value) in (4, 5)


def _escape_like(value: str) -> str:
    """对 LIKE 中的 % _ \\ 转义。"""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

# category_num → categoryName 映射（与《接口文档-前端与小程序》菜单对应）
CATEGORY_NAMES = {
    "002001009": "招标计划",
    "002001001": "招标公告",
    "002002001": "政府采购采购公告",
    "59": "采购意向公开",
    "00101": "采购公告",
}

# ────────────────────────────────────────────────────────────
# 数据库初始化：建表 DDL（幂等）
# ────────────────────────────────────────────────────────────

_INIT_DDL = """
CREATE TABLE IF NOT EXISTS users (
    id             TEXT PRIMARY KEY,
    mobile         TEXT NOT NULL UNIQUE,
    username       TEXT,
    password_hash  TEXT,
    account_status TEXT NOT NULL DEFAULT 'pending',
    created_at     TEXT NOT NULL,
    updated_at     TEXT
);

CREATE TABLE IF NOT EXISTS enterprise_applications (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    company_name   TEXT,
    credit_code    TEXT NOT NULL,
    contact_name   TEXT,
    contact_phone  TEXT,
    license_image  TEXT,
    legal_person_name  TEXT,
    legal_person_phone TEXT,
    business_scope     TEXT,
    business_address   TEXT,
    status         TEXT NOT NULL DEFAULT 'pending',
    reject_reason  TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL,
    audit_at       TEXT,
    audited_by     TEXT
);

CREATE TABLE IF NOT EXISTS articles (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    summary             TEXT,
    cover_image_url     TEXT,
    wechat_article_url  TEXT NOT NULL,
    category            TEXT,
    status              TEXT NOT NULL DEFAULT 'draft',
    sort_order          INTEGER DEFAULT 0,
    publish_time        TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    author_id           TEXT,
    author_name         TEXT,
    link_status         TEXT DEFAULT 'active',
    view_count          INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS article_operation_logs (
    id              TEXT PRIMARY KEY,
    article_id      TEXT NOT NULL,
    operation       TEXT NOT NULL,
    operator_id     TEXT NOT NULL,
    operator_name   TEXT,
    old_data        TEXT,
    new_data        TEXT,
    created_at      TEXT NOT NULL,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
"""


def _init_db() -> None:
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.executescript(_INIT_DDL)
        _ensure_column(conn, "users", "username", "TEXT")
        _ensure_column(conn, "users", "password_hash", "TEXT")
        _ensure_column(conn, "users", "account_status", "TEXT NOT NULL DEFAULT 'pending'")
        _ensure_column(conn, "users", "updated_at", "TEXT")
        _ensure_column(conn, "enterprise_applications", "legal_person_name", "TEXT")
        _ensure_column(conn, "enterprise_applications", "legal_person_phone", "TEXT")
        _ensure_column(conn, "enterprise_applications", "business_scope", "TEXT")
        _ensure_column(conn, "enterprise_applications", "business_address", "TEXT")
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username) WHERE username IS NOT NULL"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_enterprise_applications_user_created_at ON enterprise_applications(user_id, created_at DESC)"
        )
        # Articles table indexes
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_articles_status_publish ON articles(status, publish_time DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_articles_created ON articles(created_at DESC)"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_wechat_url ON articles(wechat_article_url)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_article_logs_article ON article_operation_logs(article_id, created_at DESC)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_article_logs_operator ON article_operation_logs(operator_id, created_at DESC)"
        )
        conn.commit()
    finally:
        conn.close()


def _ensure_column(conn: sqlite3.Connection, table: str, column: str, definition: str) -> None:
    columns = {
        row[1]
        for row in conn.execute(f"PRAGMA table_info({table})").fetchall()
    }
    if column not in columns:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition}")


@app.on_event("startup")
def on_startup() -> None:
    _init_db()
    conn = _get_conn()
    conn.close()
    dispatcher = crawl_control.create_dispatcher(DB_PATH)
    dispatcher.start()
    app.state.crawl_dispatcher = dispatcher


@app.on_event("shutdown")
def on_shutdown() -> None:
    dispatcher = getattr(app.state, "crawl_dispatcher", None)
    if dispatcher is not None:
        dispatcher.stop()


# ────────────────────────────────────────────────────────────
# 数据库连接
# ────────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    from crawler.storage import get_connection
    Path(DB_PATH).parent.mkdir(parents=True, exist_ok=True)
    return get_connection(DB_PATH)


# ────────────────────────────────────────────────────────────
# 鉴权依赖
# ────────────────────────────────────────────────────────────

def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    """解析 Bearer token，返回 payload；无效时返回业务 401 响应。"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=200,
            detail={"code": 401, "message": "请先登录"},
        )
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=200,
            detail={"code": 401, "message": "token 无效或已过期，请重新登录"},
        )
    return payload


def get_admin_user(authorization: Optional[str] = Header(None)) -> dict:
    """验证管理员 token，返回管理员身份；无效时返回业务 403 响应。"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=200,
            detail={"code": 403, "message": "需要管理员权限"},
        )
    token = authorization.removeprefix("Bearer ").strip()
    if token == ADMIN_TOKEN:
        return {"role": "admin", "adminId": "admin", "username": ADMIN_USERNAME}

    payload = decode_access_token(token)
    if payload and payload.get("role") == "admin":
        return {
            "role": "admin",
            "adminId": payload.get("adminId", "admin"),
            "username": payload.get("username", ADMIN_USERNAME),
        }

    raise HTTPException(
        status_code=200,
        detail={"code": 403, "message": "管理员 token 无效"},
    )


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _latest_application_for_user(conn: sqlite3.Connection, user_id: str) -> Optional[sqlite3.Row]:
    return conn.execute(
        """SELECT ea.*, u.username, u.mobile, u.account_status
           FROM enterprise_applications ea
           LEFT JOIN users u ON ea.user_id = u.id
           WHERE ea.user_id = ?
           ORDER BY ea.created_at DESC
           LIMIT 1""",
        (user_id,),
    ).fetchone()


def _find_application_by_lookup(
    conn: sqlite3.Connection,
    application_id: str,
    username: Optional[str],
    mobile: Optional[str],
) -> Optional[sqlite3.Row]:
    conditions = ["ea.id = ?"]
    params: list[Any] = [application_id]
    if username:
        conditions.append("u.username = ?")
        params.append(username)
    if mobile:
        conditions.append("u.mobile = ?")
        params.append(mobile)

    if len(conditions) == 1:
        return None

    return conn.execute(
        f"""SELECT ea.*, u.username, u.mobile, u.account_status
            FROM enterprise_applications ea
            JOIN users u ON u.id = ea.user_id
            WHERE {' AND '.join(conditions)}
            LIMIT 1""",
        params,
    ).fetchone()


def _application_snapshot(row: sqlite3.Row) -> dict[str, Any]:
    status = row["status"]
    data: dict[str, Any] = {
        "applicationId": row["id"],
        "status": status,
        "username": row["username"],
        "mobile": row["mobile"],
        "creditCode": row["credit_code"],
        "legalPersonName": row["legal_person_name"],
        "legalPersonPhone": row["legal_person_phone"],
        "businessScope": row["business_scope"],
        "businessAddress": row["business_address"],
        "createdAt": row["created_at"],
    }
    if status == "pending":
        data["nextAction"] = "wait"
    elif status == "approved":
        data["nextAction"] = "login"
        data["auditTime"] = row["audit_at"]
    elif status == "rejected":
        data["nextAction"] = "resubmit"
        data["rejectReason"] = row["reject_reason"]
    else:
        data["nextAction"] = "wait"
    return data


# ────────────────────────────────────────────────────────────
# 列表与详情行映射
# ────────────────────────────────────────────────────────────

def _row_list_item(row: sqlite3.Row, site: str) -> dict[str, Any]:
    """存储行 → 列表单条（《接口文档-前端与小程序》1.4）"""
    linkurl = row["linkurl"] or ""
    origin_url = row["origin_url"]
    if not origin_url and linkurl:
        origin_url = (SITE1_BASE if "site1" in (site or "") else SITE2_BASE) + linkurl
    if not origin_url and "site2" in (site or ""):
        plan_id = row["plan_id"] or ""
        origin_url = f"{SITE2_BASE}/maincms-web/article?type=notice&id={row['id']}&planId={plan_id}"
    return {
        "id": row["id"],
        "title": row["title"] or "",
        "publishTime": row["publish_time"],
        "sourceName": row["source_name"],
        "regionName": row["region_name"],
        "regionCode": row["region_code"] or row["tradingsourcevalue"],
        "categoryNum": row["category_num"],
        "categoryName": CATEGORY_NAMES.get(row["category_num"] or "", ""),
        "originUrl": origin_url,
        "summary": row["description"] or row["content"],
        "planId": row["plan_id"],
        "purchaseNature": row["purchase_nature"] if "purchase_nature" in row.keys() else None,
    }


def _row_detail_bid(row: sqlite3.Row, site: str) -> dict[str, Any]:
    """存储行 → 招投标详情（《接口文档-前端与小程序》2.4）"""
    linkurl = row["linkurl"] or ""
    origin_url = row["origin_url"]
    if not origin_url and linkurl:
        origin_url = (SITE1_BASE if "site1" in (site or "") else SITE2_BASE) + linkurl
    if not origin_url and "site2" in (site or ""):
        plan_id = row["plan_id"] or ""
        origin_url = f"{SITE2_BASE}/maincms-web/article?type=notice&id={row['id']}&planId={plan_id}"
    source_site_name = "四川省公共资源交易平台" if "site1" in (site or "") else "四川省政府采购网" if "site2" in (site or "") else None
    return {
        "id": row["id"],
        "title": row["title"] or "",
        "categoryNum": row["category_num"],
        "categoryName": CATEGORY_NAMES.get(row["category_num"] or "", ""),
        "publishTime": row["publish_time"],
        "projectName": row["title"],
        "budget": row["budget"],
        "location": None,
        "tenderer": row["purchaser"] or None,
        "agency": row["agency"],
        "enrollStart": None,
        "enrollEnd": None,
        "openTime": row["open_tender_time"],
        "content": row["content"],
        "originUrl": origin_url,
        "sourceSiteName": source_site_name,
    }


def _row_detail_info(row: sqlite3.Row, site: str) -> dict[str, Any]:
    """存储行 → 信息展示详情（《接口文档-前端与小程序》3.4）"""
    origin_url = row["origin_url"]
    linkurl = row["linkurl"] or ""
    if not origin_url and linkurl:
        origin_url = (SITE1_BASE if "site1" in (site or "") else SITE2_BASE) + linkurl
    if not origin_url and "site2" in (site or ""):
        plan_id = row["plan_id"] or ""
        origin_url = f"{SITE2_BASE}/maincms-web/article?type=notice&id={row['id']}&planId={plan_id}"
    source_site_name = "四川省公共资源交易平台" if "site1" in (site or "") else "四川省政府采购网" if "site2" in (site or "") else None
    return {
        "id": row["id"],
        "title": row["title"] or "",
        "publishTime": row["publish_time"],
        "description": row["description"],
        "content": row["content"],
        "originUrl": origin_url,
        "sourceSiteName": source_site_name,
    }


# ────────────────────────────────────────────────────────────
# 公告列表与详情接口
# ────────────────────────────────────────────────────────────

@app.get("/api/list")
def list_notices(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    category: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    timeStart: Optional[str] = Query(None),
    timeEnd: Optional[str] = Query(None),
    regionCode: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    purchaseManner: Optional[str] = Query(None),
    purchaseNature: Optional[str] = Query(None),
    purchaser: Optional[str] = Query(None),
):
    """列表接口，字段与《接口文档-前端与小程序》1.3、1.4 一致。
    说明：category=002002001 时 tradingsourcevalue 多为空，source 筛选可能无结果。"""
    if not category or not category.strip():
        return {"code": 200, "data": {"total": 0, "list": []}}

    conn = _get_conn()
    try:
        conditions = ["1=1"]
        params: list[Any] = []
        conditions.append("category_num = ?")
        params.append(category)
        if timeStart:
            conditions.append("publish_time >= ?")
            params.append(timeStart)
        if timeEnd:
            conditions.append("publish_time <= ?")
            params.append(timeEnd)
        if regionCode:
            # site2: 区县代码 510101/510104 等，用市级前4位前缀匹配（510100→5101%）
            region_prefix = (regionCode[:4] + "%") if len(regionCode) >= 4 else (regionCode + "%")
            s_codes = _region_to_s_codes(regionCode)
            if s_codes:
                placeholders = ",".join("?" * len(s_codes))
                conditions.append(f"(region_code LIKE ? OR tradingsourcevalue IN ({placeholders}))")
                params.append(region_prefix)
                params.extend(s_codes)
            else:
                conditions.append("region_code LIKE ?")
                params.append(region_prefix)
        if keyword:
            escaped = _escape_like(keyword)
            q = f"%{escaped}%"
            conditions.append("(title LIKE ? ESCAPE '\\' OR content LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')")
            params.extend([q, q, q])
        if source:
            if _is_s_code(source):
                conditions.append("tradingsourcevalue = ?")
                params.append(source)
            else:
                source_prefix = (source[:4] + "%") if len(source) >= 4 else (source + "%")
                s_codes = _region_to_s_codes(source)
                if s_codes:
                    placeholders = ",".join("?" * len(s_codes))
                    conditions.append(f"(region_code LIKE ? OR tradingsourcevalue IN ({placeholders}))")
                    params.append(source_prefix)
                    params.extend(s_codes)
                else:
                    conditions.append("region_code LIKE ?")
                    params.append(source_prefix)
        if purchaseManner:
            conditions.append("purchase_manner = ?")
            params.append(purchaseManner)
        if purchaseNature:
            conditions.append("purchase_nature = ?")
            params.append(purchaseNature)
        if purchaser:
            conditions.append("purchaser LIKE ? ESCAPE '\\'")
            params.append(f"%{_escape_like(purchaser)}%")

        where = " AND ".join(conditions)
        count_sql = f"SELECT COUNT(*) FROM notices WHERE {where}"
        total = conn.execute(count_sql, params).fetchone()[0]

        offset = (page - 1) * pageSize
        order = "ORDER BY publish_time DESC LIMIT ? OFFSET ?"
        params.extend([pageSize, offset])
        rows = conn.execute(
            f"SELECT * FROM notices WHERE {where} {order}",
            params,
        ).fetchall()

        list_data = [_row_list_item(row, row["site"]) for row in rows]
        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


@app.get("/api/detail/bid/{notice_id}")
def detail_bid(notice_id: str):
    """招投标详情，与《接口文档-前端与小程序》2 一致。"""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM notices WHERE id = ? LIMIT 1",
            (notice_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="not_found")
        return {"code": 200, "data": _row_detail_bid(row, row["site"])}
    finally:
        conn.close()


@app.get("/api/detail/info/{notice_id}")
def detail_info(notice_id: str):
    """信息展示详情，与《接口文档-前端与小程序》3 一致。"""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM notices WHERE id = ? LIMIT 1",
            (notice_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="not_found")
        return {"code": 200, "data": _row_detail_info(row, row["site"])}
    finally:
        conn.close()


# ────────────────────────────────────────────────────────────
# H5 探针页（用于验证小程序 WebView 是否可打开自有域名页面）
# ────────────────────────────────────────────────────────────


@app.get("/h5-probe.html", response_class=Response)
def h5_probe():
    html = """<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>H5 Probe</title>
  <style>
    :root {
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
      background: #f4f8ff;
      color: #14213d;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at top, rgba(37, 99, 235, 0.16), transparent 36%),
        linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
    }
    .card {
      width: min(560px, calc(100vw - 32px));
      padding: 28px 24px;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(20, 33, 61, 0.08);
      box-shadow: 0 20px 60px rgba(37, 99, 235, 0.12);
    }
    .eyebrow {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #2563eb;
      text-transform: uppercase;
    }
    h1 {
      margin: 10px 0 12px;
      font-size: 28px;
      line-height: 1.2;
    }
    p {
      margin: 8px 0;
      line-height: 1.7;
      color: #334155;
    }
    code {
      display: inline-block;
      margin-top: 10px;
      padding: 6px 10px;
      border-radius: 10px;
      background: #eff6ff;
      color: #1d4ed8;
      word-break: break-all;
    }
    .ok {
      margin-top: 18px;
      font-weight: 700;
      color: #15803d;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="eyebrow">WebView Probe</div>
    <h1>如果你能看到这个页面，说明小程序已经能打开自有 H5。</h1>
    <p>当前页面由招标项目后端直接返回，目的只是验证小程序 WebView 对自有域名页面的放行情况。</p>
    <p>如果这个页面能打开，但“查看原文”仍失败，那么问题就不在 WebView 基础能力，而更可能在原文代理链路本身。</p>
    <code>https://api-zhaobiao.zhangziming.cn/h5-probe.html</code>
    <p class="ok">Probe OK</p>
  </main>
</body>
</html>
"""
    return Response(content=html, media_type="text/html; charset=utf-8")


# ────────────────────────────────────────────────────────────
# WebView 代理（供小程序内打开原文，无需配置第三方业务域名）
# ────────────────────────────────────────────────────────────

_WEBVIEW_ALLOWED_HOSTS = frozenset([
    "ggzyjy.sc.gov.cn",
    "www.ccgp-sichuan.gov.cn",
])


@app.get("/api/webview-proxy", response_class=Response)
def webview_proxy(url: str = Query(..., description="目标 URL")):
    """代理获取目标页面 HTML，供小程序 web-view 加载。仅允许 ggzyjy、ccgp-sichuan 域名。"""
    try:
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise HTTPException(status_code=400, detail="invalid_url")
        host = parsed.netloc.lower()
        if host not in _WEBVIEW_ALLOWED_HOSTS:
            raise HTTPException(status_code=400, detail="domain_not_allowed")
        if parsed.scheme not in ("http", "https"):
            raise HTTPException(status_code=400, detail="invalid_scheme")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=400, detail="invalid_url")

    try:
        resp = requests.get(url, timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
        })
        resp.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail="fetch_failed")

    content_type = resp.headers.get("Content-Type", "text/html; charset=utf-8")
    body = resp.content

    if "text/html" in content_type and body:
        try:
            html = body.decode("utf-8", errors="replace")
            origin = f"{parsed.scheme}://{parsed.netloc}"
            base_tag = f'<base href="{origin}/">'
            if "<head>" in html:
                html = html.replace("<head>", f"<head>{base_tag}", 1)
            elif "<html>" in html:
                html = html.replace("<html>", f"<html><head>{base_tag}</head>", 1)
            else:
                html = base_tag + html
            body = html.encode("utf-8")
        except Exception:
            pass

    return Response(content=body, media_type=content_type)


@app.get("/WxVerify_{suffix}.txt")
def wx_verify_file(suffix: str):
    """微信业务域名校验：仅当请求路径为 WxVerify_*.txt 且文件存在时返回。"""
    if not re.match(r"^[A-Za-z0-9]+$", suffix):
        raise HTTPException(status_code=404, detail="not_found")
    verify_filename = f"WxVerify_{suffix}.txt"
    path = WX_VERIFY_DIR / verify_filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail="not_found")
    return FileResponse(path, media_type="text/plain")


# ────────────────────────────────────────────────────────────
# 字典接口
# ────────────────────────────────────────────────────────────

@app.get("/api/dict/categories")
def dict_categories():
    """公告分类字典，与《接口文档-前端与小程序》category 取值一致。"""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT category_num, category_name, sort_order FROM dict_notice_category ORDER BY sort_order"
        ).fetchall()
        return {
            "code": 200,
            "data": [
                {"code": r["category_num"], "name": r["category_name"]}
                for r in rows
            ],
        }
    finally:
        conn.close()


@app.get("/api/dict/regions")
def dict_regions():
    """地区字典，供前端筛选下拉使用。"""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT region_code, region_full_name, parent_id, is_leaf FROM dict_region ORDER BY region_code"
        ).fetchall()
        return {
            "code": 200,
            "data": [
                {
                    "code": r["region_code"],
                    "name": r["region_full_name"],
                    "parentId": r["parent_id"],
                    "isLeaf": r["is_leaf"],
                }
                for r in rows
            ],
        }
    finally:
        conn.close()


@app.get("/api/dict/purchase-manner")
def dict_purchase_manner():
    """采购方式字典，供前端筛选下拉使用。"""
    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT dict_code, dict_name FROM dict_purchase_manner ORDER BY sort_order"
        ).fetchall()
        return {
            "code": 200,
            "data": [{"code": r["dict_code"], "name": r["dict_name"]} for r in rows],
        }
    finally:
        conn.close()


# ────────────────────────────────────────────────────────────
# 认证接口
# ────────────────────────────────────────────────────────────

# 验证码 Mock 存储：key -> 验证码，用于 GET /api/auth/captcha 与（若恢复手机号登录）登录校验
_captcha_store: dict[str, str] = {}

# 1x1 透明 PNG 的 base64，用于 Mock 验证码图片
_CAPTCHA_PLACEHOLDER_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="


@app.get("/api/auth/captcha")
def get_captcha(mobile: Optional[str] = Query(None)):
    """获取验证码（Mock 模式）。固定验证码 123456，返回 base64 占位图。"""
    captcha_code = "123456"
    key = mobile.strip() if mobile and mobile.strip() else str(uuid.uuid4())
    _captcha_store[key] = captcha_code
    return {
        "code": 200,
        "data": {
            "imageBase64": _CAPTCHA_PLACEHOLDER_B64,
            "key": key,
        },
    }


class LoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/auth/login")
def login(req: LoginRequest):
    """登录名 + 密码登录，仅审核通过账号可签发 token。"""
    username = req.username.strip()
    if not username or not req.password:
        return {"code": 400, "message": "账号或密码错误"}

    conn = _get_conn()
    try:
        row = conn.execute(
            """SELECT u.id, u.username, u.mobile, u.password_hash, u.account_status,
                      ea.id AS application_id
               FROM users u
               LEFT JOIN enterprise_applications ea
                 ON ea.user_id = u.id
                AND ea.created_at = (
                    SELECT MAX(created_at)
                    FROM enterprise_applications
                    WHERE user_id = u.id
                )
               WHERE u.username = ?
               LIMIT 1""",
            (username,),
        ).fetchone()
    finally:
        conn.close()

    if row is None or not verify_password(req.password, row["password_hash"]):
        return {"code": 400, "message": "账号或密码错误"}

    if row["account_status"] == "pending":
        return {
            "code": 403,
            "message": "账号审核中",
            "data": {
                "status": "pending",
                "applicationId": row["application_id"],
            },
        }

    if row["account_status"] == "rejected":
        return {
            "code": 403,
            "message": "账号审核未通过",
            "data": {
                "status": "rejected",
                "applicationId": row["application_id"],
            },
        }

    token = create_access_token(
        {"userId": row["id"], "username": row["username"], "mobile": row["mobile"]}
    )
    return {
        "code": 200,
        "data": {
            "token": token,
            "userId": row["id"],
            "username": row["username"],
            "mobile": row["mobile"],
        },
    }


class AdminLoginRequest(BaseModel):
    username: str
    password: str


@app.post("/api/admin/login")
def admin_login(req: AdminLoginRequest):
    """固定账号密码管理员登录，返回管理员 JWT。"""
    if req.username != ADMIN_USERNAME or req.password != ADMIN_PASSWORD:
        return {"code": 400, "message": "账号或密码错误"}

    token = create_access_token(
        {
            "role": "admin",
            "adminId": "admin",
            "username": ADMIN_USERNAME,
        },
        expires_days=3650,
    )
    return {
        "code": 200,
        "data": {
            "token": token,
            "tokenType": "Bearer",
            "username": ADMIN_USERNAME,
        },
    }


class RegisterRequest(BaseModel):
    username: str
    password: str
    mobile: str
    creditCode: str
    legalPersonName: str
    legalPersonPhone: Optional[str] = None
    businessScope: Optional[str] = None
    businessAddress: str
    companyName: Optional[str] = None


@app.post("/api/auth/register")
def register(req: RegisterRequest):
    """匿名注册企业账号，创建待审核账号与申请记录。"""
    username = req.username.strip()
    if not username:
        return {"code": 400, "message": "参数错误：username 不能为空"}
    if not req.password:
        return {"code": 400, "message": "参数错误：password 不能为空"}
    if not re.fullmatch(r"\d{11}", req.mobile):
        return {"code": 400, "message": "手机号格式不正确"}
    if not req.creditCode:
        return {"code": 400, "message": "参数错误：creditCode 不能为空"}
    if len(req.creditCode) != 18:
        return {"code": 400, "message": "统一社会信用代码格式不正确"}
    if not req.legalPersonName:
        return {"code": 400, "message": "参数错误：legalPersonName 不能为空"}
    if req.legalPersonPhone and not re.fullmatch(r"\d{11}", req.legalPersonPhone):
        return {"code": 400, "message": "法人电话号码格式不正确"}
    if not req.businessAddress:
        return {"code": 400, "message": "参数错误：businessAddress 不能为空"}

    conn = _get_conn()
    try:
        existing_user = conn.execute(
            """SELECT id, username, mobile, account_status
               FROM users
               WHERE username = ? OR mobile = ?
               ORDER BY created_at DESC
               LIMIT 1""",
            (username, req.mobile),
        ).fetchone()

        now = _now_iso()
        if existing_user:
            if existing_user["username"] == username and existing_user["mobile"] != req.mobile:
                return {"code": 409, "message": "登录名已存在"}
            if existing_user["mobile"] == req.mobile and existing_user["username"] != username:
                return {"code": 409, "message": "手机号已存在"}

            existing = _latest_application_for_user(conn, existing_user["id"])
            existing_status = existing["status"] if existing else existing_user["account_status"]
            if existing_status == "pending":
                return {
                    "code": 409,
                    "message": "已有审核中的注册申请",
                    "data": {
                        "status": "pending",
                        "applicationId": existing["id"] if existing else None,
                    },
                }
            if existing_status == "approved":
                return {
                    "code": 409,
                    "message": "账号已审核通过，请直接登录",
                }
            if existing_status == "rejected" and existing:
                conn.execute(
                    """UPDATE users
                       SET username = ?, mobile = ?, password_hash = ?, account_status = 'pending', updated_at = ?
                       WHERE id = ?""",
                    (
                        username,
                        req.mobile,
                        hash_password(req.password),
                        now,
                        existing_user["id"],
                    ),
                )
                conn.execute(
                    """UPDATE enterprise_applications
                       SET company_name = ?, credit_code = ?, contact_name = ?, contact_phone = ?,
                           license_image = ?, legal_person_name = ?, legal_person_phone = ?, business_scope = ?,
                           business_address = ?, status = 'pending', reject_reason = NULL, updated_at = ?,
                           audit_at = NULL, audited_by = NULL
                       WHERE id = ?""",
                    (
                        req.companyName or username,
                        req.creditCode,
                        req.legalPersonName,
                        req.mobile,
                        "",
                        req.legalPersonName,
                        req.legalPersonPhone,
                        req.businessScope,
                        req.businessAddress,
                        now,
                        existing["id"],
                    ),
                )
                conn.commit()
                return {
                    "code": 200,
                    "data": {
                        "applicationId": existing["id"],
                        "status": "pending",
                        "username": username,
                    },
                }

            return {"code": 409, "message": "账号信息不允许重复注册"}

        user_id = str(uuid.uuid4())
        app_id = str(uuid.uuid4())
        conn.execute(
            """INSERT INTO users(id, mobile, username, password_hash, account_status, created_at, updated_at)
               VALUES(?, ?, ?, ?, 'pending', ?, ?)""",
            (user_id, req.mobile, username, hash_password(req.password), now, now),
        )
        conn.execute(
            """INSERT INTO enterprise_applications
               (id, user_id, company_name, credit_code, contact_name, contact_phone, license_image,
                legal_person_name, legal_person_phone, business_scope, business_address,
                status, created_at, updated_at)
               VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)""",
            (
                app_id,
                user_id,
                req.companyName or username,
                req.creditCode,
                req.legalPersonName,
                req.mobile,
                "",
                req.legalPersonName,
                req.legalPersonPhone,
                req.businessScope,
                req.businessAddress,
                now,
                now,
            ),
        )
        conn.commit()

        return {
            "code": 200,
            "data": {
                "applicationId": app_id,
                "status": "pending",
                "username": username,
            },
        }
    finally:
        conn.close()


@app.get("/api/auth/audit-status")
def audit_status(
    applicationId: str = Query(...),
    username: Optional[str] = Query(None),
    mobile: Optional[str] = Query(None),
):
    """基于注册标识查询当前账号审核状态。"""
    if not username and not mobile:
        return {"code": 400, "message": "参数错误：username 或 mobile 至少提供一个"}

    conn = _get_conn()
    try:
        row = _find_application_by_lookup(conn, applicationId, username, mobile)
    finally:
        conn.close()

    if not row:
        return {"code": 404, "message": "未找到注册申请记录"}

    return {"code": 200, "data": _application_snapshot(row)}


@app.get("/api/auth/me")
def auth_me(authorization: Optional[str] = Header(None)):
    """根据 token 获取当前登录用户的账号与审核状态，供「我的」页展示。"""
    payload = get_current_user(authorization)
    user_id = payload.get("userId")
    if not user_id:
        return {"code": 401, "message": "token 无效，请重新登录"}

    conn = _get_conn()
    try:
        row = _latest_application_for_user(conn, user_id)
    finally:
        conn.close()

    if not row:
        # 用户存在但无申请记录（异常情况），返回基础用户信息
        conn = _get_conn()
        try:
            user_row = conn.execute(
                "SELECT id, username, mobile, account_status FROM users WHERE id = ?",
                (user_id,),
            ).fetchone()
        finally:
            conn.close()
        if not user_row:
            return {"code": 404, "message": "用户不存在"}
        return {
            "code": 200,
            "data": {
                "username": user_row["username"],
                "mobile": user_row["mobile"],
                "status": user_row["account_status"] or "pending",
                "nextAction": "register",
            },
        }

    return {"code": 200, "data": _application_snapshot(row)}


# ────────────────────────────────────────────────────────────
# 管理员审核接口
# ────────────────────────────────────────────────────────────

@app.get("/api/admin/reviews")
def admin_review_list(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    authorization: Optional[str] = Header(None),
):
    """管理员查看企业认证申请列表，支持按状态筛选和分页。"""
    get_admin_user(authorization)

    conn = _get_conn()
    try:
        conditions = ["1=1"]
        params: list[Any] = []
        
        if status:
            conditions.append("status = ?")
            params.append(status)

        where = " AND ".join(conditions)
        count_sql = f"SELECT COUNT(*) FROM enterprise_applications WHERE {where}"
        total = conn.execute(count_sql, params).fetchone()[0]

        offset = (page - 1) * pageSize
        # 待审核优先，其次驳回，最后其他
        order = "ORDER BY CASE ea.status WHEN 'pending' THEN 0 WHEN 'rejected' THEN 1 ELSE 2 END, ea.created_at DESC LIMIT ? OFFSET ?"
        params.extend([pageSize, offset])
        
        rows = conn.execute(
            f"""SELECT ea.id, ea.user_id, ea.company_name, ea.credit_code, ea.contact_name,
                       ea.contact_phone, ea.license_image, ea.legal_person_name,
                       ea.legal_person_phone, ea.business_scope, ea.business_address,
                       ea.status, ea.reject_reason,
                       ea.created_at, ea.updated_at, ea.audit_at, ea.audited_by,
                       u.mobile, u.username, u.account_status
                FROM enterprise_applications ea
                LEFT JOIN users u ON ea.user_id = u.id
                WHERE {where} {order}""",
            params,
        ).fetchall()

        list_data = [
            {
                "id": row["id"],
                "userId": row["user_id"],
                "username": row["username"],
                "userMobile": row["mobile"],
                "companyName": row["company_name"] or row["username"] or "-",
                "creditCode": row["credit_code"],
                "contactName": row["legal_person_name"] or row["contact_name"],
                "contactPersonName": row["contact_name"],
                "contactPhone": row["legal_person_phone"] or row["contact_phone"] or row["mobile"],
                "legalPersonName": row["legal_person_name"],
                "legalPersonPhone": row["legal_person_phone"],
                "businessScope": row["business_scope"],
                "businessAddress": row["business_address"],
                "status": row["status"],
                "accountStatus": row["account_status"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "auditAt": row["audit_at"],
                "auditedBy": row["audited_by"],
            }
            for row in rows
        ]

        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


@app.get("/api/admin/reviews/{application_id}")
def admin_review_detail(application_id: str, authorization: Optional[str] = Header(None)):
    """管理员查看单个企业认证申请的详细信息。"""
    get_admin_user(authorization)

    conn = _get_conn()
    try:
        row = conn.execute(
            """SELECT ea.*, u.mobile, u.username, u.account_status
               FROM enterprise_applications ea
               LEFT JOIN users u ON ea.user_id = u.id
               WHERE ea.id = ? LIMIT 1""",
            (application_id,),
        ).fetchone()

        if not row:
            return {"code": 404, "message": "申请记录不存在"}

        return {
            "code": 200,
            "data": {
                "id": row["id"],
                "userId": row["user_id"],
                "username": row["username"],
                "userMobile": row["mobile"],
                "companyName": row["company_name"] or row["username"] or "-",
                "creditCode": row["credit_code"],
                "contactName": row["legal_person_name"] or row["contact_name"],
                "contactPersonName": row["contact_name"],
                "contactPhone": row["legal_person_phone"] or row["contact_phone"] or row["mobile"],
                "legalPersonName": row["legal_person_name"],
                "legalPersonPhone": row["legal_person_phone"],
                "businessScope": row["business_scope"],
                "businessAddress": row["business_address"],
                "licenseImage": row["license_image"],
                "status": row["status"],
                "accountStatus": row["account_status"],
                "rejectReason": row["reject_reason"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "auditAt": row["audit_at"],
                "auditedBy": row["audited_by"],
            },
        }
    finally:
        conn.close()


class ApproveRequest(BaseModel):
    pass


@app.post("/api/admin/reviews/{application_id}/approve")
def admin_approve(application_id: str, req: ApproveRequest, authorization: Optional[str] = Header(None)):
    """管理员审核通过企业认证申请。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")

    conn = _get_conn()
    try:
        # 检查申请是否存在
        row = conn.execute(
            "SELECT id, status FROM enterprise_applications WHERE id = ? LIMIT 1",
            (application_id,),
        ).fetchone()

        if not row:
            return {"code": 404, "message": "申请记录不存在"}

        if row["status"] == "approved":
            return {"code": 400, "message": "该申请已经通过审核"}

        # 更新为通过状态
        now = _now_iso()
        conn.execute(
            """UPDATE enterprise_applications
               SET status = 'approved', audit_at = ?, audited_by = ?, updated_at = ?, reject_reason = NULL
               WHERE id = ?""",
            (now, admin_id, now, application_id),
        )
        conn.execute(
            """UPDATE users
               SET account_status = 'approved', updated_at = ?
               WHERE id = (SELECT user_id FROM enterprise_applications WHERE id = ?)""",
            (now, application_id),
        )
        conn.commit()

        return {
            "code": 200,
            "data": {
                "applicationId": application_id,
                "status": "approved",
                "auditAt": now,
                "auditedBy": admin_id,
            },
        }
    finally:
        conn.close()


class RejectRequest(BaseModel):
    rejectReason: str


@app.post("/api/admin/reviews/{application_id}/reject")
def admin_reject(application_id: str, req: RejectRequest, authorization: Optional[str] = Header(None)):
    """管理员驳回企业认证申请。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")

    if not req.rejectReason:
        return {"code": 400, "message": "驳回原因不能为空"}

    conn = _get_conn()
    try:
        # 检查申请是否存在
        row = conn.execute(
            "SELECT id, status FROM enterprise_applications WHERE id = ? LIMIT 1",
            (application_id,),
        ).fetchone()

        if not row:
            return {"code": 404, "message": "申请记录不存在"}

        if row["status"] == "rejected":
            return {"code": 400, "message": "该申请已经被驳回"}

        # 更新为驳回状态
        now = _now_iso()
        conn.execute(
            """UPDATE enterprise_applications
               SET status = 'rejected', reject_reason = ?, audit_at = ?, audited_by = ?, updated_at = ?
               WHERE id = ?""",
            (req.rejectReason, now, admin_id, now, application_id),
        )
        conn.execute(
            """UPDATE users
               SET account_status = 'rejected', updated_at = ?
               WHERE id = (SELECT user_id FROM enterprise_applications WHERE id = ?)""",
            (now, application_id),
        )
        conn.commit()

        return {
            "code": 200,
            "data": {
                "applicationId": application_id,
                "status": "rejected",
                "rejectReason": req.rejectReason,
                "auditAt": now,
                "auditedBy": admin_id,
            },
        }
    finally:
        conn.close()


@app.get("/api/admin/companies")
def admin_company_list(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    authorization: Optional[str] = Header(None),
):
    """管理员查看企业目录，展示当前有效企业视图。"""
    get_admin_user(authorization)

    conn = _get_conn()
    try:
        conditions = ["1=1"]
        params: list[Any] = []
        
        if status:
            conditions.append("status = ?")
            params.append(status)

        where = " AND ".join(conditions)
        
        # 使用子查询获取每个用户的最新申请
        count_sql = f"""
            SELECT COUNT(DISTINCT user_id) 
            FROM enterprise_applications 
            WHERE id IN (
                SELECT id FROM enterprise_applications ea1
                WHERE ea1.created_at = (
                    SELECT MAX(created_at) FROM enterprise_applications ea2 
                    WHERE ea2.user_id = ea1.user_id
                )
            ) AND {where}
        """
        total = conn.execute(count_sql, params).fetchone()[0]

        offset = (page - 1) * pageSize
        params_with_limit = params + [pageSize, offset]
        
        rows = conn.execute(
            f"""SELECT ea.id, ea.user_id, ea.company_name, ea.credit_code, ea.contact_name,
                       ea.contact_phone, ea.legal_person_name, ea.legal_person_phone,
                       ea.business_scope, ea.business_address, ea.status, ea.reject_reason,
                       ea.created_at, ea.updated_at, ea.audit_at, ea.audited_by,
                       u.mobile, u.username, u.account_status
                FROM enterprise_applications ea
                LEFT JOIN users u ON ea.user_id = u.id
                WHERE ea.id IN (
                    SELECT id FROM enterprise_applications ea1
                    WHERE ea1.created_at = (
                        SELECT MAX(created_at) FROM enterprise_applications ea2 
                        WHERE ea2.user_id = ea1.user_id
                    )
                ) AND {where}
                ORDER BY ea.updated_at DESC
                LIMIT ? OFFSET ?""",
            params_with_limit,
        ).fetchall()

        list_data = [
            {
                "id": row["id"],
                "userId": row["user_id"],
                "username": row["username"],
                "userMobile": row["mobile"],
                "companyName": row["company_name"] or row["username"] or "-",
                "creditCode": row["credit_code"],
                "contactName": row["legal_person_name"] or row["contact_name"],
                "contactPersonName": row["contact_name"],
                "contactPhone": row["legal_person_phone"] or row["contact_phone"] or row["mobile"],
                "legalPersonName": row["legal_person_name"],
                "legalPersonPhone": row["legal_person_phone"],
                "businessScope": row["business_scope"],
                "businessAddress": row["business_address"],
                "status": row["status"],
                "accountStatus": row["account_status"],
                "rejectReason": row["reject_reason"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "auditAt": row["audit_at"],
                "auditedBy": row["audited_by"],
            }
            for row in rows
        ]

        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


class AdminCrawlRunCreateRequest(BaseModel):
    actionKey: str
    params: dict[str, Any] = Field(default_factory=dict)


@app.get("/api/admin/crawl/actions")
def admin_crawl_actions(authorization: Optional[str] = Header(None)):
    """管理员查看可触发的 crawl 控制面动作。"""
    get_admin_user(authorization)
    return {"code": 200, "data": {"actions": crawl_control.list_supported_actions()}}


@app.get("/api/admin/crawl/runs")
def admin_crawl_runs(
    status: Optional[str] = Query(None),
    site: Optional[str] = Query(None),
    actionKey: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    authorization: Optional[str] = Header(None),
):
    """管理员查看 crawl 控制面运行历史。"""
    get_admin_user(authorization)
    runs = crawl_control.list_runs(
        DB_PATH,
        status=status,
        site=site,
        action_key=actionKey,
        limit=limit,
    )
    return {"code": 200, "data": {"list": runs}}


@app.get("/api/admin/crawl/runs/{run_id}")
def admin_crawl_run_detail(run_id: str, authorization: Optional[str] = Header(None)):
    """管理员查看单次 crawl 控制面运行详情。"""
    get_admin_user(authorization)
    run = crawl_control.get_run(DB_PATH, run_id)
    if not run:
        return {"code": 404, "message": "运行记录不存在"}
    return {"code": 200, "data": run}


@app.post("/api/admin/crawl/runs")
def admin_crawl_submit_run(
    req: AdminCrawlRunCreateRequest,
    authorization: Optional[str] = Header(None),
):
    """管理员提交 crawl 控制面手工执行请求。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")
    try:
        run = crawl_control.submit_run_request(
            DB_PATH,
            requested_by=admin_id,
            action_key=req.actionKey,
            params=req.params,
        )
    except crawl_control.ControlPlaneValidationError as exc:
        return {"code": exc.status_code, "message": exc.message}

    if run["status"] == "rejected":
        return {
            "code": 409,
            "message": run["statusReason"] or "请求已被拒绝",
            "data": run,
        }

    return {
        "code": 200,
        "message": "请求已受理",
        "data": run,
    }


# ────────────────────────────────────────────────────────────
# 文章管理接口 (Article Management)
# ────────────────────────────────────────────────────────────

from server.models import ArticleCreate, ArticleUpdate, ArticleResponse
from server.article_utils import extract_article_info, now_iso, generate_id


class ValidateUrlRequest(BaseModel):
    url: str


@app.post("/api/admin/articles/validate-url")
def validate_article_url(req: ValidateUrlRequest, authorization: Optional[str] = Header(None)):
    """管理员校验公众号链接并提取文章信息。"""
    get_admin_user(authorization)
    
    result = extract_article_info(req.url)
    return {"code": 200, "data": result}


class CheckDuplicateRequest(BaseModel):
    url: str
    excludeId: Optional[str] = None


@app.post("/api/admin/articles/check-duplicate")
def check_duplicate_article(req: CheckDuplicateRequest, authorization: Optional[str] = Header(None)):
    """管理员检查文章链接是否重复。"""
    get_admin_user(authorization)
    
    conn = _get_conn()
    try:
        if req.excludeId:
            row = conn.execute(
                "SELECT id, title, status FROM articles WHERE wechat_article_url = ? AND id != ? LIMIT 1",
                (req.url, req.excludeId),
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT id, title, status FROM articles WHERE wechat_article_url = ? LIMIT 1",
                (req.url,),
            ).fetchone()
        
        if row:
            return {
                "code": 200,
                "data": {
                    "exists": True,
                    "article": {
                        "id": row["id"],
                        "title": row["title"],
                        "status": row["status"],
                    }
                }
            }
        else:
            return {"code": 200, "data": {"exists": False}}
    finally:
        conn.close()


@app.post("/api/admin/articles")
def create_article(req: ArticleCreate, authorization: Optional[str] = Header(None)):
    """管理员创建文章。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")
    admin_name = admin.get("username", "admin")
    
    conn = _get_conn()
    try:
        # Check duplicate
        existing = conn.execute(
            "SELECT id FROM articles WHERE wechat_article_url = ? LIMIT 1",
            (req.wechatArticleUrl,),
        ).fetchone()
        
        if existing:
            return {"code": 409, "message": "该公众号文章链接已存在"}
        
        # Create article
        article_id = generate_id()
        now = now_iso()
        
        conn.execute(
            """INSERT INTO articles 
               (id, title, summary, cover_image_url, wechat_article_url, category, 
                status, sort_order, created_at, updated_at, author_id, author_name)
               VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)""",
            (
                article_id,
                req.title,
                req.summary,
                req.coverImageUrl,
                req.wechatArticleUrl,
                req.category,
                req.sortOrder,
                now,
                now,
                admin_id,
                admin_name,
            ),
        )
        
        # Log operation
        log_id = generate_id()
        conn.execute(
            """INSERT INTO article_operation_logs 
               (id, article_id, operation, operator_id, operator_name, new_data, created_at)
               VALUES (?, ?, 'create', ?, ?, ?, ?)""",
            (log_id, article_id, admin_id, admin_name, req.model_dump_json(), now),
        )
        
        conn.commit()
        
        # Return created article
        row = conn.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
        return {
            "code": 200,
            "data": {
                "id": row["id"],
                "title": row["title"],
                "summary": row["summary"],
                "coverImageUrl": row["cover_image_url"],
                "wechatArticleUrl": row["wechat_article_url"],
                "category": row["category"],
                "status": row["status"],
                "sortOrder": row["sort_order"],
                "publishTime": row["publish_time"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "authorId": row["author_id"],
                "authorName": row["author_name"],
                "linkStatus": row["link_status"],
                "viewCount": row["view_count"],
            }
        }
    finally:
        conn.close()


@app.get("/api/admin/articles")
def get_admin_articles(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    authorization: Optional[str] = Header(None),
):
    """管理员查看文章列表，支持分页、筛选、搜索。"""
    get_admin_user(authorization)
    
    conn = _get_conn()
    try:
        conditions = ["1=1"]
        params: list[Any] = []
        
        if status:
            conditions.append("status = ?")
            params.append(status)
        
        if category:
            conditions.append("category = ?")
            params.append(category)
        
        if keyword:
            escaped = _escape_like(keyword)
            q = f"%{escaped}%"
            conditions.append("(title LIKE ? ESCAPE '\\' OR summary LIKE ? ESCAPE '\\')")
            params.extend([q, q])
        
        where = " AND ".join(conditions)
        count_sql = f"SELECT COUNT(*) FROM articles WHERE {where}"
        total = conn.execute(count_sql, params).fetchone()[0]
        
        offset = (page - 1) * pageSize
        order = "ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([pageSize, offset])
        
        rows = conn.execute(
            f"SELECT * FROM articles WHERE {where} {order}",
            params,
        ).fetchall()
        
        list_data = [
            {
                "id": row["id"],
                "title": row["title"],
                "summary": row["summary"],
                "coverImageUrl": row["cover_image_url"],
                "wechatArticleUrl": row["wechat_article_url"],
                "category": row["category"],
                "status": row["status"],
                "sortOrder": row["sort_order"],
                "publishTime": row["publish_time"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "authorId": row["author_id"],
                "authorName": row["author_name"],
                "linkStatus": row["link_status"],
                "viewCount": row["view_count"],
            }
            for row in rows
        ]
        
        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


@app.get("/api/admin/articles/{article_id}")
def get_admin_article(article_id: str, authorization: Optional[str] = Header(None)):
    """管理员查看文章详情。"""
    get_admin_user(authorization)
    
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM articles WHERE id = ? LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not row:
            return {"code": 404, "message": "文章不存在"}
        
        return {
            "code": 200,
            "data": {
                "id": row["id"],
                "title": row["title"],
                "summary": row["summary"],
                "coverImageUrl": row["cover_image_url"],
                "wechatArticleUrl": row["wechat_article_url"],
                "category": row["category"],
                "status": row["status"],
                "sortOrder": row["sort_order"],
                "publishTime": row["publish_time"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "authorId": row["author_id"],
                "authorName": row["author_name"],
                "linkStatus": row["link_status"],
                "viewCount": row["view_count"],
            }
        }
    finally:
        conn.close()


@app.put("/api/admin/articles/{article_id}")
def update_article(article_id: str, req: ArticleUpdate, authorization: Optional[str] = Header(None)):
    """管理员更新文章。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")
    admin_name = admin.get("username", "admin")
    
    conn = _get_conn()
    try:
        # Check if article exists
        old_row = conn.execute(
            "SELECT * FROM articles WHERE id = ? LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not old_row:
            return {"code": 404, "message": "文章不存在"}
        
        # Check duplicate URL if URL is being changed
        if req.wechatArticleUrl and req.wechatArticleUrl != old_row["wechat_article_url"]:
            existing = conn.execute(
                "SELECT id FROM articles WHERE wechat_article_url = ? AND id != ? LIMIT 1",
                (req.wechatArticleUrl, article_id),
            ).fetchone()
            
            if existing:
                return {"code": 409, "message": "该公众号文章链接已存在"}
        
        # Build update query
        updates = []
        params: list[Any] = []
        
        if req.title is not None:
            updates.append("title = ?")
            params.append(req.title)
        
        if req.summary is not None:
            updates.append("summary = ?")
            params.append(req.summary)
        
        if req.coverImageUrl is not None:
            updates.append("cover_image_url = ?")
            params.append(req.coverImageUrl)
        
        if req.wechatArticleUrl is not None:
            updates.append("wechat_article_url = ?")
            params.append(req.wechatArticleUrl)
        
        if req.category is not None:
            updates.append("category = ?")
            params.append(req.category)
        
        if req.sortOrder is not None:
            updates.append("sort_order = ?")
            params.append(req.sortOrder)
        
        if not updates:
            return {"code": 400, "message": "没有需要更新的字段"}
        
        now = now_iso()
        updates.append("updated_at = ?")
        params.append(now)
        params.append(article_id)
        
        conn.execute(
            f"UPDATE articles SET {', '.join(updates)} WHERE id = ?",
            params,
        )
        
        # Log operation
        log_id = generate_id()
        old_data = dict(old_row)
        conn.execute(
            """INSERT INTO article_operation_logs 
               (id, article_id, operation, operator_id, operator_name, old_data, new_data, created_at)
               VALUES (?, ?, 'update', ?, ?, ?, ?, ?)""",
            (log_id, article_id, admin_id, admin_name, str(old_data), req.model_dump_json(), now),
        )
        
        conn.commit()
        
        # Return updated article
        row = conn.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
        return {
            "code": 200,
            "data": {
                "id": row["id"],
                "title": row["title"],
                "summary": row["summary"],
                "coverImageUrl": row["cover_image_url"],
                "wechatArticleUrl": row["wechat_article_url"],
                "category": row["category"],
                "status": row["status"],
                "sortOrder": row["sort_order"],
                "publishTime": row["publish_time"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
                "authorId": row["author_id"],
                "authorName": row["author_name"],
                "linkStatus": row["link_status"],
                "viewCount": row["view_count"],
            }
        }
    finally:
        conn.close()


@app.post("/api/admin/articles/{article_id}/publish")
def publish_article(article_id: str, authorization: Optional[str] = Header(None)):
    """管理员发布文章。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")
    admin_name = admin.get("username", "admin")
    
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM articles WHERE id = ? LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not row:
            return {"code": 404, "message": "文章不存在"}
        
        if row["status"] == "published":
            return {"code": 400, "message": "文章已发布"}
        
        now = now_iso()
        conn.execute(
            "UPDATE articles SET status = 'published', publish_time = ?, updated_at = ? WHERE id = ?",
            (now, now, article_id),
        )
        
        # Log operation
        log_id = generate_id()
        conn.execute(
            """INSERT INTO article_operation_logs 
               (id, article_id, operation, operator_id, operator_name, created_at)
               VALUES (?, ?, 'publish', ?, ?, ?)""",
            (log_id, article_id, admin_id, admin_name, now),
        )
        
        conn.commit()
        
        return {
            "code": 200,
            "data": {
                "id": article_id,
                "status": "published",
                "publishTime": now,
            }
        }
    finally:
        conn.close()


@app.post("/api/admin/articles/{article_id}/unpublish")
def unpublish_article(article_id: str, authorization: Optional[str] = Header(None)):
    """管理员下线文章。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")
    admin_name = admin.get("username", "admin")
    
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM articles WHERE id = ? LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not row:
            return {"code": 404, "message": "文章不存在"}
        
        if row["status"] != "published":
            return {"code": 400, "message": "文章未发布"}
        
        now = now_iso()
        conn.execute(
            "UPDATE articles SET status = 'draft', updated_at = ? WHERE id = ?",
            (now, article_id),
        )
        
        # Log operation
        log_id = generate_id()
        conn.execute(
            """INSERT INTO article_operation_logs 
               (id, article_id, operation, operator_id, operator_name, created_at)
               VALUES (?, ?, 'unpublish', ?, ?, ?)""",
            (log_id, article_id, admin_id, admin_name, now),
        )
        
        conn.commit()
        
        return {
            "code": 200,
            "data": {
                "id": article_id,
                "status": "draft",
            }
        }
    finally:
        conn.close()


@app.delete("/api/admin/articles/{article_id}")
def delete_article(article_id: str, authorization: Optional[str] = Header(None)):
    """管理员删除文章。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "admin")
    admin_name = admin.get("username", "admin")
    
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM articles WHERE id = ? LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not row:
            return {"code": 404, "message": "文章不存在"}
        
        # Log operation before deletion
        now = now_iso()
        log_id = generate_id()
        old_data = dict(row)
        conn.execute(
            """INSERT INTO article_operation_logs 
               (id, article_id, operation, operator_id, operator_name, old_data, created_at)
               VALUES (?, ?, 'delete', ?, ?, ?, ?)""",
            (log_id, article_id, admin_id, admin_name, str(old_data), now),
        )
        
        # Delete article
        conn.execute("DELETE FROM articles WHERE id = ?", (article_id,))
        conn.commit()
        
        return {"code": 200, "message": "删除成功"}
    finally:
        conn.close()


@app.get("/api/admin/articles/{article_id}/logs")
def get_article_logs(article_id: str, authorization: Optional[str] = Header(None)):
    """管理员查询文章操作历史。"""
    get_admin_user(authorization)
    
    conn = _get_conn()
    try:
        rows = conn.execute(
            """SELECT * FROM article_operation_logs 
               WHERE article_id = ? 
               ORDER BY created_at DESC""",
            (article_id,),
        ).fetchall()
        
        logs = [
            {
                "id": row["id"],
                "articleId": row["article_id"],
                "operation": row["operation"],
                "operatorId": row["operator_id"],
                "operatorName": row["operator_name"],
                "oldData": row["old_data"],
                "newData": row["new_data"],
                "createdAt": row["created_at"],
            }
            for row in rows
        ]
        
        return {"code": 200, "data": {"list": logs}}
    finally:
        conn.close()


# ────────────────────────────────────────────────────────────
# 小程序端文章接口
# ────────────────────────────────────────────────────────────

@app.get("/api/articles")
def get_articles(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
):
    """小程序获取已发布文章列表，支持分页、分类筛选。"""
    conn = _get_conn()
    try:
        conditions = ["status = 'published'"]
        params: list[Any] = []
        
        if category:
            if category == 'other':
                conditions.append("category IN ('other', 'announcement')")
            else:
                conditions.append("category = ?")
                params.append(category)
        
        where = " AND ".join(conditions)
        count_sql = f"SELECT COUNT(*) FROM articles WHERE {where}"
        total = conn.execute(count_sql, params).fetchone()[0]
        
        offset = (page - 1) * pageSize
        order = "ORDER BY sort_order DESC, publish_time DESC LIMIT ? OFFSET ?"
        params.extend([pageSize, offset])
        
        rows = conn.execute(
            f"SELECT * FROM articles WHERE {where} {order}",
            params,
        ).fetchall()
        
        list_data = [
            {
                "id": row["id"],
                "title": row["title"],
                "summary": row["summary"],
                "coverImageUrl": row["cover_image_url"],
                "wechatArticleUrl": row["wechat_article_url"],
                "category": row["category"],
                "publishTime": row["publish_time"],
                "viewCount": row["view_count"],
            }
            for row in rows
        ]
        
        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


@app.get("/api/articles/{article_id}")
def get_article(article_id: str):
    """小程序获取文章详情，只返回已发布文章。"""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT * FROM articles WHERE id = ? AND status = 'published' LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not row:
            return {"code": 404, "message": "文章不存在或未发布"}
        
        return {
            "code": 200,
            "data": {
                "id": row["id"],
                "title": row["title"],
                "summary": row["summary"],
                "coverImageUrl": row["cover_image_url"],
                "wechatArticleUrl": row["wechat_article_url"],
                "category": row["category"],
                "publishTime": row["publish_time"],
                "viewCount": row["view_count"],
            }
        }
    finally:
        conn.close()


@app.post("/api/articles/{article_id}/view")
def record_article_view(article_id: str):
    """小程序记录文章浏览（可选功能）。"""
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id FROM articles WHERE id = ? AND status = 'published' LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not row:
            return {"code": 404, "message": "文章不存在或未发布"}
        
        conn.execute(
            "UPDATE articles SET view_count = view_count + 1 WHERE id = ?",
            (article_id,),
        )
        conn.commit()
        
        return {"code": 200, "message": "记录成功"}
    finally:
        conn.close()
