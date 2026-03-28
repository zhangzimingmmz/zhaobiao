# 公告列表与详情 API，从 notices 表读取并按《接口文档-前端与小程序》映射字段
# 运行：在项目根目录执行 PYTHONPATH=. uvicorn server.main:app --reload

from __future__ import annotations

import base64
import os
import re
import sys
import uuid
from bs4 import BeautifulSoup
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
from server.notice_body_rendering import render_notice_body

app = FastAPI(title="招投标公告 API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# 数据库路径：环境变量 NOTICES_DB 或默认项目根 data/notices.db
DB_PATH = os.environ.get("NOTICES_DB", str(_root / "data" / "notices.db"))

# 管理员认证：环境变量 ADMIN_TOKEN 或默认值（仅用于开发/内网环境）
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "admin-secret-token-change-in-production")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123456")
ADMIN_REVIEWER1_USERNAME = os.environ.get("ADMIN_REVIEWER1_USERNAME", "reviewer1")
ADMIN_REVIEWER1_PASSWORD = os.environ.get("ADMIN_REVIEWER1_PASSWORD", "reviewer123456")
ADMIN_REVIEWER2_USERNAME = os.environ.get("ADMIN_REVIEWER2_USERNAME", "reviewer2")
ADMIN_REVIEWER2_PASSWORD = os.environ.get("ADMIN_REVIEWER2_PASSWORD", "reviewer223456")

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
    "002001010": "招标文件预公示",
    "002001001": "招标公告",
    "002002001": "政府采购采购公告",
    "59": "采购意向公开",
    "00101": "采购公告",
}

SUPER_ADMIN_ACCOUNT = {
    "adminId": "super_admin",
    "username": ADMIN_USERNAME,
    "password": ADMIN_PASSWORD,
    "role": "super_admin",
}

BOOTSTRAP_REVIEWER_ACCOUNTS = [
    {
        "adminId": "reviewer_1",
        "username": ADMIN_REVIEWER1_USERNAME,
        "password": ADMIN_REVIEWER1_PASSWORD,
        "role": "reviewer",
    },
    {
        "adminId": "reviewer_2",
        "username": ADMIN_REVIEWER2_USERNAME,
        "password": ADMIN_REVIEWER2_PASSWORD,
        "role": "reviewer",
    },
]

MAX_ACTIVE_REVIEWERS = 3

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

CREATE TABLE IF NOT EXISTS user_favorites (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    target_type     TEXT NOT NULL,
    target_id       TEXT NOT NULL,
    target_site     TEXT,
    created_at      TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_settings (
    key             TEXT PRIMARY KEY,
    value           TEXT,
    updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users (
    id              TEXT PRIMARY KEY,
    username        TEXT NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active',
    created_at      TEXT NOT NULL,
    updated_at      TEXT NOT NULL
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
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_user_favorites_user_created_at ON user_favorites(user_id, created_at DESC)"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_bid_unique ON user_favorites(user_id, target_type, target_site, target_id) WHERE target_type = 'bid'"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_user_favorites_info_unique ON user_favorites(user_id, target_type, target_id) WHERE target_type = 'info'"
        )
        conn.execute(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username_unique ON admin_users(username)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_admin_users_role_status ON admin_users(role, status, updated_at DESC)"
        )
        _bootstrap_reviewer_accounts(conn)
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


def _get_app_setting(conn: sqlite3.Connection, key: str) -> str:
    row = conn.execute(
        "SELECT value FROM app_settings WHERE key = ? LIMIT 1",
        (key,),
    ).fetchone()
    return (row["value"] if row and row["value"] is not None else "").strip()


def _set_app_setting(conn: sqlite3.Connection, key: str, value: str) -> None:
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """INSERT INTO app_settings (key, value, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             value = excluded.value,
             updated_at = excluded.updated_at""",
        (key, value.strip(), now),
    )


def _normalize_admin_username(value: str) -> str:
    username = (value or "").strip()
    if not username:
        raise HTTPException(status_code=200, detail={"code": 400, "message": "用户名不能为空"})
    if len(username) < 3 or len(username) > 32:
        raise HTTPException(status_code=200, detail={"code": 400, "message": "用户名长度需在 3-32 位之间"})
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,32}", username):
        raise HTTPException(status_code=200, detail={"code": 400, "message": "用户名仅支持字母、数字、点、下划线和中划线"})
    return username


def _normalize_admin_password(value: str) -> str:
    password = (value or "").strip()
    if len(password) < 8 or len(password) > 128:
        raise HTTPException(status_code=200, detail={"code": 400, "message": "密码长度需在 8-128 位之间"})
    return password


def _should_bootstrap_reviewer(account: dict[str, str]) -> bool:
    username = (account.get("username") or "").strip()
    password = (account.get("password") or "").strip()
    if not username or not password:
        return False
    if password.startswith("replace-with-"):
        return False
    return True


def _bootstrap_reviewer_accounts(conn: sqlite3.Connection) -> None:
    now = _now_iso()
    for account in BOOTSTRAP_REVIEWER_ACCOUNTS:
        if not _should_bootstrap_reviewer(account):
            continue
        existing_by_id = conn.execute(
            "SELECT id FROM admin_users WHERE id = ? LIMIT 1",
            (account["adminId"],),
        ).fetchone()
        if existing_by_id:
            continue
        existing_by_username = conn.execute(
            "SELECT id FROM admin_users WHERE username = ? LIMIT 1",
            ((account["username"] or "").strip(),),
        ).fetchone()
        if existing_by_username:
            continue
        conn.execute(
            """INSERT INTO admin_users (id, username, password_hash, role, status, created_at, updated_at)
               VALUES (?, ?, ?, 'reviewer', 'active', ?, ?)""",
            (
                account["adminId"],
                _normalize_admin_username(account["username"]),
                hash_password(_normalize_admin_password(account["password"])),
                now,
                now,
            ),
        )


def _serialize_admin_user(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "adminId": row["id"],
        "username": row["username"],
        "role": row["role"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def _get_admin_db_account_by_id(conn: sqlite3.Connection, admin_id: Optional[str]) -> Optional[sqlite3.Row]:
    if not admin_id:
        return None
    return conn.execute(
        """SELECT id, username, password_hash, role, status, created_at, updated_at
           FROM admin_users
           WHERE id = ? LIMIT 1""",
        (admin_id,),
    ).fetchone()


def _get_admin_db_account_by_username(conn: sqlite3.Connection, username: str) -> Optional[sqlite3.Row]:
    return conn.execute(
        """SELECT id, username, password_hash, role, status, created_at, updated_at
           FROM admin_users
           WHERE username = ? LIMIT 1""",
        (username,),
    ).fetchone()


def _count_active_reviewers(conn: sqlite3.Connection, exclude_admin_id: Optional[str] = None) -> int:
    if exclude_admin_id:
        row = conn.execute(
            """SELECT COUNT(1)
               FROM admin_users
               WHERE role = 'reviewer' AND status = 'active' AND id != ?""",
            (exclude_admin_id,),
        ).fetchone()
    else:
        row = conn.execute(
            """SELECT COUNT(1)
               FROM admin_users
               WHERE role = 'reviewer' AND status = 'active'"""
        ).fetchone()
    return int(row[0] if row else 0)


def _reviewer_has_audit_history(conn: sqlite3.Connection, admin_id: str) -> bool:
    row = conn.execute(
        "SELECT 1 FROM enterprise_applications WHERE audited_by = ? LIMIT 1",
        (admin_id,),
    ).fetchone()
    return row is not None


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


def get_optional_user(authorization: Optional[str]) -> Optional[dict]:
    """尝试解析 Bearer token；无 token 或无效 token 时返回 None。"""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    return decode_access_token(token)


def get_admin_user(authorization: Optional[str] = Header(None)) -> dict:
    """验证管理员 token，返回管理员身份；无效时返回业务 403 响应。"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=200,
            detail={"code": 403, "message": "需要管理员权限"},
        )
    token = authorization.removeprefix("Bearer ").strip()
    if token == ADMIN_TOKEN:
        return {
            "role": "super_admin",
            "adminId": "super_admin",
            "username": ADMIN_USERNAME,
        }

    payload = decode_access_token(token)
    if payload and payload.get("role") in {"admin", "super_admin", "reviewer"}:
        role = payload.get("role") or "super_admin"
        if role == "admin":
            role = "super_admin"
        admin_id = payload.get("adminId") or ("super_admin" if role == "super_admin" else "")
        if admin_id == "admin":
            admin_id = "super_admin"
        if role == "super_admin":
            return {
                "role": "super_admin",
                "adminId": "super_admin",
                "username": payload.get("username") or ADMIN_USERNAME,
            }
        conn = _get_conn()
        try:
            row = _get_admin_db_account_by_id(conn, admin_id)
        finally:
            conn.close()
        if row and row["role"] == "reviewer" and row["status"] == "active":
            return {
                "role": "reviewer",
                "adminId": row["id"],
                "username": row["username"],
            }
        raise HTTPException(
            status_code=200,
            detail={"code": 403, "message": "审核员账号不可用"},
        )

    raise HTTPException(
        status_code=200,
        detail={"code": 403, "message": "管理员 token 无效"},
    )


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _admin_username_by_id(admin_id: Optional[str]) -> Optional[str]:
    if not admin_id:
        return None
    if admin_id in {"admin", "super_admin"}:
        return ADMIN_USERNAME
    conn = _get_conn()
    try:
        row = _get_admin_db_account_by_id(conn, admin_id)
        return row["username"] if row else admin_id
    finally:
        conn.close()


def _admin_display_name(admin_id: Optional[str], username: Optional[str] = None) -> Optional[str]:
    return username or _admin_username_by_id(admin_id)


def _require_super_admin(admin: dict) -> None:
    if admin.get("role") != "super_admin":
        raise HTTPException(
            status_code=200,
            detail={"code": 403, "message": "仅超级管理员可执行该操作"},
        )


def _application_to_admin_payload(row: sqlite3.Row) -> dict[str, Any]:
    audited_by = row["audited_by"]
    audited_by_username = row["audited_by_username"] if "audited_by_username" in row.keys() else None
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "username": row["username"],
        "userMobile": row["mobile"],
        "companyName": row["company_name"] or row["username"] or "-",
        "creditCode": row["credit_code"],
        "contactName": row["contact_name"] or row["legal_person_name"],
        "contactPersonName": row["contact_name"],
        "contactPhone": row["contact_phone"] or row["mobile"],
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
        "auditedBy": audited_by,
        "auditedByName": _admin_display_name(audited_by, audited_by_username),
    }


def _looks_like_test_company(row: sqlite3.Row) -> bool:
    signals = [
        row["company_name"],
        row["username"],
        row["credit_code"],
        row["contact_name"],
        row["contact_phone"],
        row["mobile"],
        row["legal_person_name"],
        row["business_address"],
    ]
    normalized = " ".join(str(value).lower() for value in signals if value)
    test_tokens = ["测试", "test", "demo", "sample", "admin", "zzm", "123456", "000000"]
    return any(token in normalized for token in test_tokens)


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


def _infer_favorites_type(category_num: Optional[str]) -> str:
    if category_num in {"002001009", "002001010", "002001001", "002002001"}:
        return "construction"
    if category_num in {"59", "00101"}:
        return "government"
    return "info"


def _favorite_bid_key(site: str, notice_id: str) -> tuple[str, str]:
    return (site or "", notice_id)


def _load_user_favorite_sets(conn: sqlite3.Connection, user_id: Optional[str]) -> dict[str, set[Any]]:
    if not user_id:
        return {"bid": set(), "info": set()}

    rows = conn.execute(
        "SELECT target_type, target_id, target_site FROM user_favorites WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    bid_keys: set[tuple[str, str]] = set()
    info_ids: set[str] = set()
    for row in rows:
        if row["target_type"] == "bid":
            bid_keys.add(_favorite_bid_key(row["target_site"], row["target_id"]))
        elif row["target_type"] == "info":
            info_ids.add(row["target_id"])
    return {"bid": bid_keys, "info": info_ids}


# ────────────────────────────────────────────────────────────
# 列表与详情行映射
# ────────────────────────────────────────────────────────────

def _build_source_page_url(row: sqlite3.Row, site: str) -> Optional[str]:
    """返回主站详情页地址，而不是主站页面中再次转发的下游原文链接。"""
    linkurl = row["linkurl"] or ""
    if linkurl:
        return (SITE1_BASE if "site1" in (site or "") else SITE2_BASE) + linkurl
    if "site2" in (site or ""):
        plan_id = row["plan_id"] or ""
        return f"{SITE2_BASE}/maincms-web/article?type=notice&id={row['id']}&planId={plan_id}"
    upstream_origin_url = row["origin_url"] or None
    return upstream_origin_url


def _row_list_item(row: sqlite3.Row, site: str, *, favorited: bool = False) -> dict[str, Any]:
    """存储行 → 列表单条（《接口文档-前端与小程序》1.4）"""
    origin_url = _build_source_page_url(row, site)
    upstream_origin_url = row["origin_url"] or None
    summary = row["description"] or row["content"] or ""
    if summary and re.search(r"<[a-zA-Z][^>]*>", summary):
        summary = BeautifulSoup(summary, "html.parser").get_text(" ", strip=True)
    summary = re.sub(r"\s+", " ", summary).strip()
    return {
        "id": row["id"],
        "site": site,
        "title": row["title"] or "",
        "publishTime": row["publish_time"],
        "sourceName": row["source_name"],
        "regionName": row["region_name"],
        "regionCode": row["region_code"] or row["tradingsourcevalue"],
        "categoryNum": row["category_num"],
        "categoryName": CATEGORY_NAMES.get(row["category_num"] or "", ""),
        "originUrl": origin_url,
        "upstreamOriginUrl": upstream_origin_url,
        "summary": summary,
        "planId": row["plan_id"],
        "purchaseNature": row["purchase_nature"] if "purchase_nature" in row.keys() else None,
        "favorited": favorited,
    }


def _row_detail_bid(row: sqlite3.Row, site: str, *, favorited: bool = False) -> dict[str, Any]:
    """存储行 → 招投标详情（《接口文档-前端与小程序》2.4）"""
    origin_url = _build_source_page_url(row, site)
    upstream_origin_url = row["origin_url"] or None
    source_site_name = "四川省公共资源交易平台" if "site1" in (site or "") else "四川省政府采购网" if "site2" in (site or "") else None
    return {
        "id": row["id"],
        "site": site,
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
        "content": render_notice_body(row["content"], site, row["category_num"]),
        "originUrl": origin_url,
        "upstreamOriginUrl": upstream_origin_url,
        "sourceSiteName": source_site_name,
        "favorited": favorited,
    }


def _row_detail_info(row: sqlite3.Row, site: str, *, favorited: bool = False) -> dict[str, Any]:
    """存储行 → 信息展示详情（《接口文档-前端与小程序》3.4）"""
    origin_url = _build_source_page_url(row, site)
    upstream_origin_url = row["origin_url"] or None
    source_site_name = "四川省公共资源交易平台" if "site1" in (site or "") else "四川省政府采购网" if "site2" in (site or "") else None
    return {
        "id": row["id"],
        "site": site,
        "title": row["title"] or "",
        "publishTime": row["publish_time"],
        "description": row["description"],
        "content": render_notice_body(row["content"], site, row["category_num"]),
        "originUrl": origin_url,
        "upstreamOriginUrl": upstream_origin_url,
        "sourceSiteName": source_site_name,
        "favorited": favorited,
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
    authorization: Optional[str] = Header(None),
):
    """列表接口，字段与《接口文档-前端与小程序》1.3、1.4 一致。
    说明：category=002002001 时 tradingsourcevalue 多为空，source 筛选可能无结果。"""
    if not category or not category.strip():
        return {"code": 200, "data": {"total": 0, "list": []}}

    conn = _get_conn()
    try:
        payload = get_optional_user(authorization)
        favorite_sets = _load_user_favorite_sets(conn, payload.get("userId") if payload else None)
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

        list_data = [
            _row_list_item(
                row,
                row["site"],
                favorited=_favorite_bid_key(row["site"], row["id"]) in favorite_sets["bid"],
            )
            for row in rows
        ]
        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


@app.get("/api/detail/bid/{notice_id}")
def detail_bid(notice_id: str, authorization: Optional[str] = Header(None)):
    """招投标详情，与《接口文档-前端与小程序》2 一致。"""
    conn = _get_conn()
    try:
        payload = get_optional_user(authorization)
        row = conn.execute(
            "SELECT * FROM notices WHERE id = ? LIMIT 1",
            (notice_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="not_found")
        favorite_sets = _load_user_favorite_sets(conn, payload.get("userId") if payload else None)
        return {
            "code": 200,
            "data": _row_detail_bid(
                row,
                row["site"],
                favorited=_favorite_bid_key(row["site"], row["id"]) in favorite_sets["bid"],
            ),
        }
    finally:
        conn.close()


@app.get("/api/detail/info/{notice_id}")
def detail_info(notice_id: str, authorization: Optional[str] = Header(None)):
    """信息展示详情，与《接口文档-前端与小程序》3 一致。"""
    conn = _get_conn()
    try:
        payload = get_optional_user(authorization)
        row = conn.execute(
            "SELECT * FROM notices WHERE id = ? LIMIT 1",
            (notice_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="not_found")
        favorite_sets = _load_user_favorite_sets(conn, payload.get("userId") if payload else None)
        return {
            "code": 200,
            "data": _row_detail_info(
                row,
                row["site"],
                favorited=row["id"] in favorite_sets["info"],
            ),
        }
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
    """管理员登录，返回管理员 JWT。"""
    username = (req.username or "").strip()
    password = req.password or ""

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = create_access_token(
            {
                "role": SUPER_ADMIN_ACCOUNT["role"],
                "adminId": SUPER_ADMIN_ACCOUNT["adminId"],
                "username": SUPER_ADMIN_ACCOUNT["username"],
            },
            expires_days=3650,
        )
        return {
            "code": 200,
            "data": {
                "token": token,
                "tokenType": "Bearer",
                "username": SUPER_ADMIN_ACCOUNT["username"],
                "adminId": SUPER_ADMIN_ACCOUNT["adminId"],
                "role": SUPER_ADMIN_ACCOUNT["role"],
            },
        }

    conn = _get_conn()
    try:
        account = _get_admin_db_account_by_username(conn, username)
    finally:
        conn.close()

    if not account or account["role"] != "reviewer" or not verify_password(password, account["password_hash"]):
        return {"code": 400, "message": "账号或密码错误"}
    if account["status"] != "active":
        return {"code": 403, "message": "账号已停用"}

    token = create_access_token(
        {
            "role": account["role"],
            "adminId": account["id"],
            "username": account["username"],
        },
        expires_days=3650,
    )
    return {
        "code": 200,
        "data": {
            "token": token,
            "tokenType": "Bearer",
            "username": account["username"],
            "adminId": account["id"],
            "role": account["role"],
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


class FavoriteToggleRequest(BaseModel):
    targetId: str
    targetType: str
    targetSite: Optional[str] = None


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
                       au.username AS audited_by_username,
                       u.mobile, u.username, u.account_status
                FROM enterprise_applications ea
                LEFT JOIN users u ON ea.user_id = u.id
                LEFT JOIN admin_users au ON ea.audited_by = au.id
                WHERE {where} {order}""",
            params,
        ).fetchall()

        list_data = [_application_to_admin_payload(row) for row in rows]

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
            """SELECT ea.*, au.username AS audited_by_username, u.mobile, u.username, u.account_status
               FROM enterprise_applications ea
               LEFT JOIN users u ON ea.user_id = u.id
               LEFT JOIN admin_users au ON ea.audited_by = au.id
               WHERE ea.id = ? LIMIT 1""",
            (application_id,),
        ).fetchone()

        if not row:
            return {"code": 404, "message": "申请记录不存在"}

        payload = _application_to_admin_payload(row)
        payload["licenseImage"] = row["license_image"]
        return {"code": 200, "data": payload}
    finally:
        conn.close()


class ApproveRequest(BaseModel):
    pass


@app.post("/api/admin/reviews/{application_id}/approve")
def admin_approve(application_id: str, req: ApproveRequest, authorization: Optional[str] = Header(None)):
    """管理员审核通过企业认证申请。"""
    admin = get_admin_user(authorization)
    admin_id = admin.get("adminId", "super_admin")

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
                "auditedByName": _admin_display_name(admin_id, admin.get("username")),
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
    admin_id = admin.get("adminId", "super_admin")

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
                "auditedByName": _admin_display_name(admin_id, admin.get("username")),
            },
        }
    finally:
        conn.close()


class InvalidateRequest(BaseModel):
    reason: Optional[str] = None


@app.post("/api/admin/reviews/{application_id}/invalidate")
def admin_invalidate_review(
    application_id: str,
    req: InvalidateRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员作废企业认证申请。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)
    admin_id = admin.get("adminId", "super_admin")

    now = _now_iso()
    reason = (req.reason or "管理员作废申请").strip() or "管理员作废申请"

    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id, user_id FROM enterprise_applications WHERE id = ? LIMIT 1",
            (application_id,),
        ).fetchone()
        if not row:
            return {"code": 404, "message": "申请记录不存在"}

        conn.execute(
            """UPDATE enterprise_applications
               SET status = 'invalidated', reject_reason = ?, audit_at = ?, audited_by = ?, updated_at = ?
               WHERE id = ?""",
            (reason, now, admin_id, now, application_id),
        )
        conn.execute(
            """UPDATE users
               SET account_status = 'rejected', updated_at = ?
               WHERE id = ?""",
            (now, row["user_id"]),
        )
        conn.commit()
        return {
            "code": 200,
            "data": {
                "applicationId": application_id,
                "status": "invalidated",
                "reason": reason,
                "auditAt": now,
                "auditedBy": admin_id,
                "auditedByName": _admin_display_name(admin_id, admin.get("username")),
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
                       au.username AS audited_by_username,
                       u.mobile, u.username, u.account_status
                FROM enterprise_applications ea
                LEFT JOIN users u ON ea.user_id = u.id
                LEFT JOIN admin_users au ON ea.audited_by = au.id
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

        list_data = [_application_to_admin_payload(row) for row in rows]

        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


@app.get("/api/admin/companies/{application_id}")
def admin_company_detail(application_id: str, authorization: Optional[str] = Header(None)):
    """管理员查看企业当前档案详情。"""
    get_admin_user(authorization)

    conn = _get_conn()
    try:
        row = conn.execute(
            """SELECT ea.*, au.username AS audited_by_username, u.mobile, u.username, u.account_status
               FROM enterprise_applications ea
               LEFT JOIN users u ON ea.user_id = u.id
               LEFT JOIN admin_users au ON ea.audited_by = au.id
               WHERE ea.id = ? LIMIT 1""",
            (application_id,),
        ).fetchone()

        if not row:
            return {"code": 404, "message": "企业档案不存在"}

        payload = _application_to_admin_payload(row)
        payload["licenseImage"] = row["license_image"]
        return {"code": 200, "data": payload}
    finally:
        conn.close()


class AdminCompanyUpdateRequest(BaseModel):
    companyName: str
    creditCode: str
    contactName: Optional[str] = None
    contactPhone: Optional[str] = None
    legalPersonName: Optional[str] = None
    legalPersonPhone: Optional[str] = None
    businessScope: Optional[str] = None
    businessAddress: Optional[str] = None


@app.put("/api/admin/companies/{application_id}")
def admin_company_update(
    application_id: str,
    req: AdminCompanyUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员更新企业档案。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)

    if not req.companyName.strip():
        return {"code": 400, "message": "企业名称不能为空"}
    if not req.creditCode.strip():
        return {"code": 400, "message": "统一社会信用代码不能为空"}

    now = _now_iso()
    conn = _get_conn()
    try:
        row = conn.execute(
            "SELECT id FROM enterprise_applications WHERE id = ? LIMIT 1",
            (application_id,),
        ).fetchone()
        if not row:
            return {"code": 404, "message": "企业档案不存在"}

        conn.execute(
            """UPDATE enterprise_applications
               SET company_name = ?, credit_code = ?, contact_name = ?, contact_phone = ?,
                   legal_person_name = ?, legal_person_phone = ?, business_scope = ?,
                   business_address = ?, updated_at = ?
               WHERE id = ?""",
            (
                req.companyName.strip(),
                req.creditCode.strip(),
                req.contactName.strip() if req.contactName else None,
                req.contactPhone.strip() if req.contactPhone else None,
                req.legalPersonName.strip() if req.legalPersonName else None,
                req.legalPersonPhone.strip() if req.legalPersonPhone else None,
                req.businessScope.strip() if req.businessScope else None,
                req.businessAddress.strip() if req.businessAddress else None,
                now,
                application_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()

    return admin_company_detail(application_id, authorization)


class DeleteTestCompanyRequest(BaseModel):
    confirmCreditCode: str


@app.post("/api/admin/companies/{application_id}/delete-test-data")
def admin_delete_test_company(
    application_id: str,
    req: DeleteTestCompanyRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员删除企业档案及关联账号数据。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)

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
            return {"code": 404, "message": "企业档案不存在"}
        if (req.confirmCreditCode or "").strip() != (row["credit_code"] or ""):
            return {"code": 400, "message": "统一社会信用代码确认不一致"}

        conn.execute("DELETE FROM user_favorites WHERE user_id = ?", (row["user_id"],))
        conn.execute("DELETE FROM enterprise_applications WHERE user_id = ?", (row["user_id"],))
        conn.execute("DELETE FROM users WHERE id = ?", (row["user_id"],))
        conn.commit()
        return {
            "code": 200,
            "data": {
                "applicationId": application_id,
                "userId": row["user_id"],
                "deletedBy": admin.get("adminId"),
                "deletedByName": admin.get("username"),
            },
        }
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


class SupportPhoneUpdateRequest(BaseModel):
    supportPhone: str = Field(default="")


def _normalize_support_phone(value: Optional[str]) -> str:
    phone = (value or "").strip()
    if not phone:
        return ""
    if len(phone) > 32:
        raise HTTPException(status_code=400, detail="客服电话长度不能超过 32 位")
    if not re.fullmatch(r"[\d\-+\s()#]{5,32}", phone):
        raise HTTPException(status_code=400, detail="客服电话格式不正确")
    return phone


@app.get("/api/admin/app-settings/contact")
def get_admin_contact_settings(authorization: Optional[str] = Header(None)):
    """管理员查看客服电话配置。"""
    get_admin_user(authorization)
    conn = _get_conn()
    try:
        return {
            "code": 200,
            "data": {
                "supportPhone": _get_app_setting(conn, "support_phone"),
            },
        }
    finally:
        conn.close()


@app.put("/api/admin/app-settings/contact")
def update_admin_contact_settings(
    req: SupportPhoneUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """管理员更新客服电话配置。"""
    get_admin_user(authorization)
    phone = _normalize_support_phone(req.supportPhone)
    conn = _get_conn()
    try:
        _set_app_setting(conn, "support_phone", phone)
        conn.commit()
        return {"code": 200, "data": {"supportPhone": phone}}
    finally:
        conn.close()


@app.get("/api/app/contact")
def get_public_contact_settings():
    """小程序读取客服电话配置。"""
    conn = _get_conn()
    try:
        return {
            "code": 200,
            "data": {
                "supportPhone": _get_app_setting(conn, "support_phone"),
            },
        }
    finally:
        conn.close()


class AdminReviewerCreateRequest(BaseModel):
    username: str
    password: str


class AdminReviewerResetPasswordRequest(BaseModel):
    password: str


class AdminReviewerUpdateRequest(BaseModel):
    username: str


class AdminReviewerStatusRequest(BaseModel):
    status: str


class AdminReviewerDeleteRequest(BaseModel):
    confirmUsername: str


@app.get("/api/admin/reviewers")
def admin_reviewer_list(authorization: Optional[str] = Header(None)):
    """超级管理员查看审核员账号列表。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)
    conn = _get_conn()
    try:
        rows = conn.execute(
            """SELECT id, username, role, status, created_at, updated_at
               FROM admin_users
               WHERE role = 'reviewer'
               ORDER BY CASE status WHEN 'active' THEN 0 ELSE 1 END, updated_at DESC, created_at DESC"""
        ).fetchall()
        return {
            "code": 200,
            "data": {
                "total": len(rows),
                "activeCount": _count_active_reviewers(conn),
                "maxActiveReviewers": MAX_ACTIVE_REVIEWERS,
                "list": [_serialize_admin_user(row) for row in rows],
            },
        }
    finally:
        conn.close()


@app.post("/api/admin/reviewers")
def admin_reviewer_create(
    req: AdminReviewerCreateRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员创建审核员账号。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)

    username = _normalize_admin_username(req.username)
    password = _normalize_admin_password(req.password)
    if username == ADMIN_USERNAME:
        return {"code": 400, "message": "该用户名已被占用"}

    now = _now_iso()
    reviewer_id = f"reviewer_{uuid.uuid4().hex[:12]}"
    conn = _get_conn()
    try:
        exists = _get_admin_db_account_by_username(conn, username)
        if exists:
            return {"code": 400, "message": "该用户名已被占用"}
        active_count = _count_active_reviewers(conn)
        if active_count >= MAX_ACTIVE_REVIEWERS:
            return {
                "code": 400,
                "message": f"最多只能有 {MAX_ACTIVE_REVIEWERS} 个启用中的审核员，请先停用或删除未使用账号",
            }
        conn.execute(
            """INSERT INTO admin_users (id, username, password_hash, role, status, created_at, updated_at)
               VALUES (?, ?, ?, 'reviewer', 'active', ?, ?)""",
            (reviewer_id, username, hash_password(password), now, now),
        )
        conn.commit()
        row = _get_admin_db_account_by_id(conn, reviewer_id)
        return {"code": 200, "data": _serialize_admin_user(row)}
    finally:
        conn.close()


@app.post("/api/admin/reviewers/{admin_id}/reset-password")
def admin_reviewer_reset_password(
    admin_id: str,
    req: AdminReviewerResetPasswordRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员重置审核员密码。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)

    password = _normalize_admin_password(req.password)
    now = _now_iso()
    conn = _get_conn()
    try:
        row = _get_admin_db_account_by_id(conn, admin_id)
        if not row or row["role"] != "reviewer":
            return {"code": 404, "message": "审核员账号不存在"}
        conn.execute(
            "UPDATE admin_users SET password_hash = ?, updated_at = ? WHERE id = ?",
            (hash_password(password), now, admin_id),
        )
        conn.commit()
        updated = _get_admin_db_account_by_id(conn, admin_id)
        return {"code": 200, "data": _serialize_admin_user(updated)}
    finally:
        conn.close()


@app.put("/api/admin/reviewers/{admin_id}")
def admin_reviewer_update(
    admin_id: str,
    req: AdminReviewerUpdateRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员修改审核员用户名。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)

    username = _normalize_admin_username(req.username)
    if username == ADMIN_USERNAME:
        return {"code": 400, "message": "该用户名已被占用"}

    now = _now_iso()
    conn = _get_conn()
    try:
        row = _get_admin_db_account_by_id(conn, admin_id)
        if not row or row["role"] != "reviewer":
            return {"code": 404, "message": "审核员账号不存在"}
        if row["username"] == username:
            return {"code": 400, "message": "用户名未发生变化"}
        exists = _get_admin_db_account_by_username(conn, username)
        if exists and exists["id"] != admin_id:
            return {"code": 400, "message": "该用户名已被占用"}
        conn.execute(
            "UPDATE admin_users SET username = ?, updated_at = ? WHERE id = ?",
            (username, now, admin_id),
        )
        conn.commit()
        updated = _get_admin_db_account_by_id(conn, admin_id)
        return {"code": 200, "data": _serialize_admin_user(updated)}
    finally:
        conn.close()


@app.post("/api/admin/reviewers/{admin_id}/status")
def admin_reviewer_update_status(
    admin_id: str,
    req: AdminReviewerStatusRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员启用或禁用审核员账号。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)

    status = (req.status or "").strip().lower()
    if status not in {"active", "disabled"}:
        return {"code": 400, "message": "状态仅支持 active 或 disabled"}

    now = _now_iso()
    conn = _get_conn()
    try:
        row = _get_admin_db_account_by_id(conn, admin_id)
        if not row or row["role"] != "reviewer":
            return {"code": 404, "message": "审核员账号不存在"}
        if status == "active" and row["status"] != "active":
            active_count = _count_active_reviewers(conn, exclude_admin_id=admin_id)
            if active_count >= MAX_ACTIVE_REVIEWERS:
                return {
                    "code": 400,
                    "message": f"最多只能有 {MAX_ACTIVE_REVIEWERS} 个启用中的审核员，请先停用或删除未使用账号",
                }
        conn.execute(
            "UPDATE admin_users SET status = ?, updated_at = ? WHERE id = ?",
            (status, now, admin_id),
        )
        conn.commit()
        updated = _get_admin_db_account_by_id(conn, admin_id)
        return {"code": 200, "data": _serialize_admin_user(updated)}
    finally:
        conn.close()


@app.delete("/api/admin/reviewers/{admin_id}")
def admin_reviewer_delete(
    admin_id: str,
    req: AdminReviewerDeleteRequest,
    authorization: Optional[str] = Header(None),
):
    """超级管理员删除从未参与审核的审核员账号。"""
    admin = get_admin_user(authorization)
    _require_super_admin(admin)

    conn = _get_conn()
    try:
        row = _get_admin_db_account_by_id(conn, admin_id)
        if not row or row["role"] != "reviewer":
            return {"code": 404, "message": "审核员账号不存在"}
        if (req.confirmUsername or "").strip() != row["username"]:
            return {"code": 400, "message": "请输入该审核员用户名以确认删除"}
        if _reviewer_has_audit_history(conn, admin_id):
            return {"code": 400, "message": "该审核员已有历史审核记录，不能删除，请改为停用或修改用户名"}
        conn.execute("DELETE FROM admin_users WHERE id = ?", (admin_id,))
        conn.commit()
        return {
            "code": 200,
            "data": {
                "adminId": admin_id,
                "username": row["username"],
            },
        }
    finally:
        conn.close()


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
    keyword: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    authorization: Optional[str] = Header(None),
):
    """小程序获取已发布文章列表，支持分页、分类筛选、关键词搜索。"""
    conn = _get_conn()
    try:
        payload = get_optional_user(authorization)
        favorite_sets = _load_user_favorite_sets(conn, payload.get("userId") if payload else None)
        conditions = ["status = 'published'"]
        params: list[Any] = []
        
        if category:
            if category == 'other':
                conditions.append("category IN ('other', 'announcement')")
            else:
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
                "favorited": row["id"] in favorite_sets["info"],
            }
            for row in rows
        ]
        
        return {"code": 200, "data": {"total": total, "list": list_data}}
    finally:
        conn.close()


@app.get("/api/articles/{article_id}")
def get_article(article_id: str, authorization: Optional[str] = Header(None)):
    """小程序获取文章详情，只返回已发布文章。"""
    conn = _get_conn()
    try:
        payload = get_optional_user(authorization)
        row = conn.execute(
            "SELECT * FROM articles WHERE id = ? AND status = 'published' LIMIT 1",
            (article_id,),
        ).fetchone()
        
        if not row:
            return {"code": 404, "message": "文章不存在或未发布"}
        
        favorite_sets = _load_user_favorite_sets(conn, payload.get("userId") if payload else None)
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
                "favorited": row["id"] in favorite_sets["info"],
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


def _favorite_bid_payload(row: sqlite3.Row) -> dict[str, Any]:
    payload = _row_list_item(row, row["site"], favorited=True)
    payload["viewType"] = "bid"
    payload["favoritesType"] = _infer_favorites_type(row["category_num"])
    return payload


def _favorite_info_payload(row: sqlite3.Row, *, source: str, site: Optional[str] = None) -> dict[str, Any]:
    if source == "article":
        return {
            "id": row["id"],
            "site": None,
            "title": row["title"],
            "summary": row["summary"],
            "coverImageUrl": row["cover_image_url"],
            "originUrl": row["wechat_article_url"],
            "publishTime": row["publish_time"],
            "category": row["category"],
            "viewType": "info",
            "favoritesType": "info",
            "favorited": True,
        }

    payload = _row_detail_info(row, site or row["site"], favorited=True)
    payload["viewType"] = "info"
    payload["favoritesType"] = "info"
    payload["coverImageUrl"] = None
    return payload


@app.get("/api/favorites")
def get_favorites(
    page: int = Query(1, ge=1),
    pageSize: int = Query(100, ge=1, le=200),
    authorization: Optional[str] = Header(None),
):
    """获取当前登录用户收藏列表，仅返回仍可解析的源数据。"""
    payload = get_current_user(authorization)
    user_id = payload.get("userId")
    if not user_id:
        return {"code": 401, "message": "请先登录"}

    conn = _get_conn()
    try:
        rows = conn.execute(
            """SELECT target_type, target_id, target_site, created_at
               FROM user_favorites
               WHERE user_id = ?
               ORDER BY created_at DESC""",
            (user_id,),
        ).fetchall()

        items: list[dict[str, Any]] = []
        for row in rows:
            target_type = row["target_type"]
            if target_type == "bid":
                notice = conn.execute(
                    "SELECT * FROM notices WHERE site = ? AND id = ? LIMIT 1",
                    (row["target_site"], row["target_id"]),
                ).fetchone()
                if not notice:
                    continue
                item = _favorite_bid_payload(notice)
            elif target_type == "info":
                article = conn.execute(
                    "SELECT * FROM articles WHERE id = ? AND status = 'published' LIMIT 1",
                    (row["target_id"],),
                ).fetchone()
                if article:
                    item = _favorite_info_payload(article, source="article")
                else:
                    if row["target_site"]:
                        notice = conn.execute(
                            "SELECT * FROM notices WHERE site = ? AND id = ? LIMIT 1",
                            (row["target_site"], row["target_id"]),
                        ).fetchone()
                    else:
                        notice = conn.execute(
                            "SELECT * FROM notices WHERE id = ? LIMIT 1",
                            (row["target_id"],),
                        ).fetchone()
                    if not notice:
                        continue
                    item = _favorite_info_payload(notice, source="notice", site=row["target_site"])
            else:
                continue

            item["savedAt"] = row["created_at"]
            items.append(item)

        total = len(items)
        start = (page - 1) * pageSize
        end = start + pageSize
        return {"code": 200, "data": {"total": total, "list": items[start:end]}}
    finally:
        conn.close()


@app.post("/api/favorites/toggle")
def toggle_favorite(req: FavoriteToggleRequest, authorization: Optional[str] = Header(None)):
    """切换当前登录用户的收藏状态。"""
    payload = get_current_user(authorization)
    user_id = payload.get("userId")
    if not user_id:
        return {"code": 401, "message": "请先登录"}

    target_type = (req.targetType or "").strip()
    target_id = (req.targetId or "").strip()
    target_site = (req.targetSite or "").strip() or None

    if target_type not in {"bid", "info"}:
        return {"code": 400, "message": "targetType 仅支持 bid 或 info"}
    if not target_id:
        return {"code": 400, "message": "targetId 不能为空"}
    if target_type == "bid" and not target_site:
        return {"code": 400, "message": "bid 收藏需要 targetSite"}

    conn = _get_conn()
    try:
        if target_type == "bid":
            source_row = conn.execute(
                "SELECT site, id FROM notices WHERE site = ? AND id = ? LIMIT 1",
                (target_site, target_id),
            ).fetchone()
            if not source_row:
                return {"code": 404, "message": "公告不存在"}
        else:
            source_row = conn.execute(
                "SELECT id FROM articles WHERE id = ? AND status = 'published' LIMIT 1",
                (target_id,),
            ).fetchone()
            if source_row:
                target_site = None
            else:
                if target_site:
                    source_row = conn.execute(
                        "SELECT site, id FROM notices WHERE site = ? AND id = ? LIMIT 1",
                        (target_site, target_id),
                    ).fetchone()
                else:
                    source_row = conn.execute(
                        "SELECT site, id FROM notices WHERE id = ? LIMIT 1",
                        (target_id,),
                    ).fetchone()
                    if source_row:
                        target_site = source_row["site"]
                if not source_row:
                    return {"code": 404, "message": "内容不存在"}

        if target_type == "bid":
            existing = conn.execute(
                """SELECT id FROM user_favorites
                   WHERE user_id = ? AND target_type = 'bid' AND target_site = ? AND target_id = ?
                   LIMIT 1""",
                (user_id, target_site, target_id),
            ).fetchone()
        else:
            existing = conn.execute(
                """SELECT id FROM user_favorites
                   WHERE user_id = ? AND target_type = 'info' AND target_id = ?
                   LIMIT 1""",
                (user_id, target_id),
            ).fetchone()

        if existing:
            conn.execute("DELETE FROM user_favorites WHERE id = ?", (existing["id"],))
            conn.commit()
            return {"code": 200, "data": {"favorited": False}}

        conn.execute(
            """INSERT INTO user_favorites(id, user_id, target_type, target_id, target_site, created_at)
               VALUES(?, ?, ?, ?, ?, ?)""",
            (str(uuid.uuid4()), user_id, target_type, target_id, target_site, _now_iso()),
        )
        conn.commit()
        return {"code": 200, "data": {"favorited": True}}
    finally:
        conn.close()
