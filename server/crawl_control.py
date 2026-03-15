from __future__ import annotations

import json
import logging
import os
import re
import sqlite3
import subprocess
import sys
import threading
import uuid
from dataclasses import dataclass
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any, Callable

from crawler.site1 import config as site1_config
from crawler.site2 import config as site2_config
from crawler.storage import get_connection

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_LOG_DIR = PROJECT_ROOT / "logs" / "admin-crawl"
DISPATCH_INTERVAL_SECONDS = float(os.environ.get("ADMIN_CRAWL_DISPATCH_INTERVAL", "1.0"))
BACKFILL_MAX_DAYS = int(os.environ.get("ADMIN_CRAWL_BACKFILL_MAX_DAYS", "7"))
ORPHANED_RUN_REASON = "dispatcher restarted before completion"
OPEN_STATUSES = ("queued", "running")
logger = logging.getLogger(__name__)


class ControlPlaneValidationError(ValueError):
    def __init__(
        self,
        message: str,
        *,
        status_code: int = 400,
        action_key: str | None = None,
        create_rejected_run: bool = False,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.action_key = action_key
        self.create_rejected_run = create_rejected_run


@dataclass(frozen=True)
class ActionParamSpec:
    key: str
    label: str
    kind: str
    required: bool = False
    help_text: str | None = None
    options: tuple[tuple[str, str], ...] = ()

    def to_dict(self) -> dict[str, Any]:
        return {
            "key": self.key,
            "label": self.label,
            "kind": self.kind,
            "required": self.required,
            "helpText": self.help_text,
            "options": [
                {"value": value, "label": label}
                for value, label in self.options
            ],
        }


@dataclass(frozen=True)
class ActionDefinition:
    action_key: str
    site: str
    site_label: str
    task_name: str
    run_kind: str
    label: str
    description: str
    params: tuple[ActionParamSpec, ...]
    command_builder: Callable[[dict[str, Any], str], list[str]]
    result_parser: Callable[[str, int], dict[str, Any]]

    def to_public_dict(self) -> dict[str, Any]:
        return {
            "actionKey": self.action_key,
            "site": self.site,
            "siteLabel": self.site_label,
            "taskName": self.task_name,
            "runKind": self.run_kind,
            "label": self.label,
            "description": self.description,
            "params": [param.to_dict() for param in self.params],
            "limits": {
                "maxBackfillDays": BACKFILL_MAX_DAYS,
            },
        }


@dataclass(frozen=True)
class DeniedAction:
    action_key: str
    site: str
    site_label: str
    task_name: str
    run_kind: str
    label: str
    reason: str


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect(db_path: str | Path) -> sqlite3.Connection:
    return get_connection(str(db_path))


def _serialize_json(payload: Any) -> str | None:
    if payload is None:
        return None
    return json.dumps(payload, ensure_ascii=False)


def _deserialize_json(payload: str | None) -> Any:
    if not payload:
        return None
    try:
        return json.loads(payload)
    except json.JSONDecodeError:
        return payload


def _parse_date(value: Any, key: str) -> date:
    if not isinstance(value, str) or not value:
        raise ControlPlaneValidationError(f"{key} 不能为空")
    try:
        return date.fromisoformat(value)
    except ValueError as exc:
        raise ControlPlaneValidationError(f"{key} 必须是 YYYY-MM-DD 格式") from exc


def _validate_no_extra_params(action: ActionDefinition, params: dict[str, Any]) -> None:
    allowed = {item.key for item in action.params}
    extras = sorted(set(params) - allowed)
    if extras:
        raise ControlPlaneValidationError(
            f"动作 {action.action_key} 不支持参数: {', '.join(extras)}"
        )


def _validate_empty_params(action: ActionDefinition, params: dict[str, Any]) -> dict[str, Any]:
    _validate_no_extra_params(action, params)
    for key, value in params.items():
        if value not in (None, ""):
            raise ControlPlaneValidationError(
                f"动作 {action.action_key} 不接受参数 {key}"
            )
    return {}


def _validate_site1_backfill(action: ActionDefinition, params: dict[str, Any]) -> dict[str, Any]:
    _validate_no_extra_params(action, params)
    start = _parse_date(params.get("start"), "start")
    end = _parse_date(params.get("end"), "end")
    if end < start:
        raise ControlPlaneValidationError("end 不能早于 start")
    days = (end - start).days + 1
    if days > BACKFILL_MAX_DAYS:
        raise ControlPlaneValidationError(
            f"backfill 超出控制面安全上限，最多允许 {BACKFILL_MAX_DAYS} 天"
        )
    category = params.get("category")
    if category:
        if category not in site1_config.ALL_CATEGORY_IDS:
            raise ControlPlaneValidationError("category 不在允许的站点一分类范围内")
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "category": category or None,
    }


def _validate_site2_backfill(action: ActionDefinition, params: dict[str, Any]) -> dict[str, Any]:
    _validate_no_extra_params(action, params)
    start = _parse_date(params.get("start"), "start")
    end = _parse_date(params.get("end"), "end")
    if end < start:
        raise ControlPlaneValidationError("end 不能早于 start")
    days = (end - start).days + 1
    if days > BACKFILL_MAX_DAYS:
        raise ControlPlaneValidationError(
            f"backfill 超出控制面安全上限，最多允许 {BACKFILL_MAX_DAYS} 天"
        )
    notice_type = params.get("noticeType")
    if notice_type:
        if notice_type not in site2_config.NOTICE_TYPES:
            raise ControlPlaneValidationError("noticeType 不在允许的站点二公告类型范围内")
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "noticeType": notice_type or None,
    }


def _validate_site2_reconcile(action: ActionDefinition, params: dict[str, Any]) -> dict[str, Any]:
    _validate_no_extra_params(action, params)
    start = _parse_date(params.get("start"), "start")
    end = _parse_date(params.get("end"), "end")
    if end < start:
        raise ControlPlaneValidationError("end 不能早于 start")
    days = (end - start).days + 1
    if days > BACKFILL_MAX_DAYS:
        raise ControlPlaneValidationError(
            f"reconcile 超出控制面安全上限，最多允许 {BACKFILL_MAX_DAYS} 天"
        )
    return {
        "start": start.isoformat(),
        "end": end.isoformat(),
    }


def _python_module_command(module: str, db_path: str, *args: str) -> list[str]:
    return [sys.executable, "-m", module, *args, "--db", db_path]


def _build_site1_incremental(params: dict[str, Any], db_path: str) -> list[str]:
    return _python_module_command("crawler.site1.tasks.incremental", db_path)


def _build_site1_recovery(params: dict[str, Any], db_path: str) -> list[str]:
    return _python_module_command("crawler.site1.tasks.recovery", db_path)


def _build_site1_backfill(params: dict[str, Any], db_path: str) -> list[str]:
    command = _python_module_command(
        "crawler.site1.tasks.backfill",
        db_path,
        "--start",
        params["start"],
        "--end",
        params["end"],
    )
    if params.get("category"):
        command.extend(["--category", params["category"]])
    return command


def _build_site2_incremental(params: dict[str, Any], db_path: str) -> list[str]:
    return _python_module_command("crawler.site2.tasks.incremental", db_path)


def _build_site2_recovery(params: dict[str, Any], db_path: str) -> list[str]:
    return _python_module_command("crawler.site2.tasks.recovery", db_path)


def _build_site2_backfill(params: dict[str, Any], db_path: str) -> list[str]:
    command = _python_module_command(
        "crawler.site2.tasks.backfill",
        db_path,
        "--start",
        params["start"],
        "--end",
        params["end"],
    )
    if params.get("noticeType"):
        command.extend(["--type", params["noticeType"]])
    return command


def _build_site2_precheck(params: dict[str, Any], db_path: str) -> list[str]:
    return _python_module_command("crawler.site2.tasks.precheck", db_path)


def _build_site2_reconcile(params: dict[str, Any], db_path: str) -> list[str]:
    return _python_module_command(
        "crawler.site2.tasks.reconcile",
        db_path,
        "--start",
        params["start"],
        "--end",
        params["end"],
    )


def _tail_text(text: str, lines: int = 12) -> str:
    chunks = [line for line in text.splitlines() if line.strip()]
    if not chunks:
        return ""
    return "\n".join(chunks[-lines:])


def _parse_site2_fetched_summary(text: str, exit_code: int) -> dict[str, Any]:
    matches = re.findall(r"complete: fetched=(\d+), upserted=(\d+), errors=(\d+)", text)
    if matches:
        fetched, upserted, errors = matches[-1]
        return {
            "summary": f"fetched={fetched}, upserted={upserted}, errors={errors}",
            "fetchedCount": int(fetched),
            "upsertedCount": int(upserted),
            "errorCount": int(errors),
        }
    tail = _tail_text(text)
    return {
        "summary": tail or ("任务成功完成" if exit_code == 0 else "任务执行失败"),
        "errorCount": 0 if exit_code == 0 else 1,
    }


def _parse_site1_incremental_summary(text: str, exit_code: int) -> dict[str, Any]:
    saved_values = [int(item) for item in re.findall(r"saved=(\d+)", text)]
    total_saved = sum(saved_values)
    if total_saved:
        return {
            "summary": f"saved={total_saved}",
            "upsertedCount": total_saved,
            "errorCount": 0 if exit_code == 0 else 1,
        }
    tail = _tail_text(text)
    return {
        "summary": tail or ("任务成功完成" if exit_code == 0 else "任务执行失败"),
        "errorCount": 0 if exit_code == 0 else 1,
    }


def _parse_site1_recovery_summary(text: str, exit_code: int) -> dict[str, Any]:
    saved_values = [int(item) for item in re.findall(r"recovery saved=(\d+)", text)]
    total_saved = sum(saved_values)
    if total_saved:
        return {
            "summary": f"recovery saved={total_saved}",
            "upsertedCount": total_saved,
            "errorCount": 0 if exit_code == 0 else 1,
        }
    return _parse_site1_incremental_summary(text, exit_code)


def _parse_site1_backfill_summary(text: str, exit_code: int) -> dict[str, Any]:
    saved_values = [int(item) for item in re.findall(r"total_saved=(\d+)", text)]
    total_saved = sum(saved_values)
    if total_saved:
        return {
            "summary": f"backfill total_saved={total_saved}",
            "upsertedCount": total_saved,
            "errorCount": 0 if exit_code == 0 else 1,
        }
    return _parse_site1_incremental_summary(text, exit_code)


def _parse_precheck_summary(text: str, exit_code: int) -> dict[str, Any]:
    cleanup_match = re.search(r"Cleanup would remove: (\d+) records", text)
    summary = "precheck 完成"
    if cleanup_match:
        summary = f"precheck 完成，cleanup would remove={cleanup_match.group(1)}"
    return {
        "summary": summary if exit_code == 0 else (_tail_text(text) or "precheck 执行失败"),
        "errorCount": 0 if exit_code == 0 else 1,
    }


def _parse_reconcile_summary(text: str, exit_code: int) -> dict[str, Any]:
    summary_line = None
    for pattern in (
        r"Reconciliation: .+",
        r"Boundary verification: .+",
        r"Recovery verification: .+",
        r"Idempotency: .+",
    ):
        matches = re.findall(pattern, text)
        if matches:
            summary_line = matches[-1]
    if not summary_line:
        summary_line = _tail_text(text)
    return {
        "summary": summary_line or ("reconcile 完成" if exit_code == 0 else "reconcile 执行失败"),
        "errorCount": 0 if exit_code == 0 else 1,
    }


SITE1_CATEGORY_OPTIONS = tuple(
    (category_id, site1_config.CATEGORIES[category_id]["name"])
    for category_id in site1_config.ALL_CATEGORY_IDS
)
SITE2_NOTICE_TYPE_OPTIONS = tuple(site2_config.NOTICE_TYPES.items())

ALLOWED_ACTIONS: dict[str, ActionDefinition] = {
    "site1.incremental": ActionDefinition(
        action_key="site1.incremental",
        site=site1_config.SITE,
        site_label="网站一",
        task_name="incremental",
        run_kind="routine",
        label="网站一增量采集",
        description="执行站点一最近窗口的增量采集。",
        params=(),
        command_builder=_build_site1_incremental,
        result_parser=_parse_site1_incremental_summary,
    ),
    "site1.recovery": ActionDefinition(
        action_key="site1.recovery",
        site=site1_config.SITE,
        site_label="网站一",
        task_name="recovery",
        run_kind="routine",
        label="网站一补偿采集",
        description="重扫站点一最近 48 小时窗口。",
        params=(),
        command_builder=_build_site1_recovery,
        result_parser=_parse_site1_recovery_summary,
    ),
    "site1.backfill": ActionDefinition(
        action_key="site1.backfill",
        site=site1_config.SITE,
        site_label="网站一",
        task_name="backfill",
        run_kind="maintenance",
        label="网站一受限回填",
        description=f"按日期范围回填站点一数据，单次最多 {BACKFILL_MAX_DAYS} 天。",
        params=(
            ActionParamSpec("start", "开始日期", "date", required=True),
            ActionParamSpec("end", "结束日期", "date", required=True),
            ActionParamSpec(
                "category",
                "分类（可选）",
                "select",
                options=SITE1_CATEGORY_OPTIONS,
                help_text="留空时执行全部网站一分类。",
            ),
        ),
        command_builder=_build_site1_backfill,
        result_parser=_parse_site1_backfill_summary,
    ),
    "site2.incremental": ActionDefinition(
        action_key="site2.incremental",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="incremental",
        run_kind="routine",
        label="网站二增量采集",
        description="执行站点二安全重叠窗口的增量采集。",
        params=(),
        command_builder=_build_site2_incremental,
        result_parser=_parse_site2_fetched_summary,
    ),
    "site2.recovery": ActionDefinition(
        action_key="site2.recovery",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="recovery",
        run_kind="routine",
        label="网站二补偿采集",
        description="重扫站点二最近 48 小时窗口。",
        params=(),
        command_builder=_build_site2_recovery,
        result_parser=_parse_site2_fetched_summary,
    ),
    "site2.backfill": ActionDefinition(
        action_key="site2.backfill",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="backfill",
        run_kind="maintenance",
        label="网站二受限回填",
        description=f"按日期范围回填站点二数据，单次最多 {BACKFILL_MAX_DAYS} 天。",
        params=(
            ActionParamSpec("start", "开始日期", "date", required=True),
            ActionParamSpec("end", "结束日期", "date", required=True),
            ActionParamSpec(
                "noticeType",
                "公告类型（可选）",
                "select",
                options=SITE2_NOTICE_TYPE_OPTIONS,
                help_text="留空时执行网站二全部公告类型。",
            ),
        ),
        command_builder=_build_site2_backfill,
        result_parser=_parse_site2_fetched_summary,
    ),
    "site2.precheck": ActionDefinition(
        action_key="site2.precheck",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="precheck",
        run_kind="diagnostic",
        label="网站二预检查",
        description="执行站点二正式初始化前的只读预检查。",
        params=(),
        command_builder=_build_site2_precheck,
        result_parser=_parse_precheck_summary,
    ),
    "site2.reconcile": ActionDefinition(
        action_key="site2.reconcile",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="reconcile",
        run_kind="diagnostic",
        label="网站二对账",
        description=f"按日期范围执行站点二 source-vs-db 对账，单次最多 {BACKFILL_MAX_DAYS} 天。",
        params=(
            ActionParamSpec("start", "开始日期", "date", required=True),
            ActionParamSpec("end", "结束日期", "date", required=True),
        ),
        command_builder=_build_site2_reconcile,
        result_parser=_parse_reconcile_summary,
    ),
}

DENIED_ACTIONS: dict[str, DeniedAction] = {
    "site2.cleanup": DeniedAction(
        action_key="site2.cleanup",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="cleanup",
        run_kind="maintenance",
        label="网站二清理测试数据",
        reason="cleanup 会删除站点二数据，只允许通过受控 shell / 运维流程执行。",
    ),
    "site2.backfill-formal": DeniedAction(
        action_key="site2.backfill-formal",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="backfill",
        run_kind="maintenance",
        label="网站二正式初始化回填",
        reason="formal backfill 隐含数据清理和大范围回填，不允许从控制面直接触发。",
    ),
    "site2.reconcile.verify-recovery": DeniedAction(
        action_key="site2.reconcile.verify-recovery",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="reconcile",
        run_kind="diagnostic",
        label="网站二恢复验证",
        reason="带 verify-recovery 的 reconcile 会触发额外写入，不开放到后台控制面。",
    ),
    "site2.reconcile.verify-boundary": DeniedAction(
        action_key="site2.reconcile.verify-boundary",
        site=site2_config.SITE_ID,
        site_label="网站二",
        task_name="reconcile",
        run_kind="diagnostic",
        label="网站二边界验证",
        reason="带 verify-boundary 的 reconcile 会执行额外写入，不开放到后台控制面。",
    ),
}

VALIDATORS: dict[str, Callable[[ActionDefinition, dict[str, Any]], dict[str, Any]]] = {
    "site1.incremental": _validate_empty_params,
    "site1.recovery": _validate_empty_params,
    "site1.backfill": _validate_site1_backfill,
    "site2.incremental": _validate_empty_params,
    "site2.recovery": _validate_empty_params,
    "site2.backfill": _validate_site2_backfill,
    "site2.precheck": _validate_empty_params,
    "site2.reconcile": _validate_site2_reconcile,
}


def list_supported_actions() -> list[dict[str, Any]]:
    return [
        action.to_public_dict()
        for action in sorted(ALLOWED_ACTIONS.values(), key=lambda item: item.action_key)
    ]


def _row_to_run(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "site": row["site"],
        "taskName": row["task_name"],
        "actionKey": row["action_key"],
        "runKind": row["run_kind"],
        "triggerSource": row["trigger_source"],
        "requestedBy": row["requested_by"],
        "status": row["status"],
        "statusReason": row["status_reason"],
        "requestPayload": _deserialize_json(row["request_payload"]),
        "resultPayload": _deserialize_json(row["result_payload"]),
        "summary": row["summary"],
        "requestedAt": row["requested_at"],
        "startedAt": row["started_at"],
        "finishedAt": row["finished_at"],
        "logPath": row["log_path"],
        "command": row["command"],
        "exitCode": row["exit_code"],
        "fetchedCount": row["fetched_count"],
        "upsertedCount": row["upserted_count"],
        "errorCount": row["error_count"],
    }


def list_runs(
    db_path: str | Path,
    *,
    status: str | None = None,
    site: str | None = None,
    action_key: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    conn = _connect(db_path)
    try:
        conditions = ["1=1"]
        params: list[Any] = []
        if status:
            conditions.append("status = ?")
            params.append(status)
        if site:
            conditions.append("site = ?")
            params.append(site)
        if action_key:
            conditions.append("action_key = ?")
            params.append(action_key)
        params.append(limit)
        rows = conn.execute(
            f"""SELECT * FROM crawl_runs
                WHERE {' AND '.join(conditions)}
                ORDER BY requested_at DESC
                LIMIT ?""",
            params,
        ).fetchall()
        return [_row_to_run(row) for row in rows]
    finally:
        conn.close()


def get_run(db_path: str | Path, run_id: str) -> dict[str, Any] | None:
    conn = _connect(db_path)
    try:
        row = conn.execute(
            "SELECT * FROM crawl_runs WHERE id = ? LIMIT 1",
            (run_id,),
        ).fetchone()
        return _row_to_run(row) if row else None
    finally:
        conn.close()


def _insert_run(
    conn: sqlite3.Connection,
    *,
    run_id: str,
    site: str,
    task_name: str,
    action_key: str,
    run_kind: str,
    trigger_source: str,
    requested_by: str,
    status: str,
    status_reason: str | None,
    request_payload: dict[str, Any],
    requested_at: str,
) -> None:
    conn.execute(
        """
        INSERT INTO crawl_runs(
            id, site, task_name, action_key, run_kind, trigger_source,
            requested_by, status, status_reason, request_payload, requested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            run_id,
            site,
            task_name,
            action_key,
            run_kind,
            trigger_source,
            requested_by,
            status,
            status_reason,
            _serialize_json(request_payload),
            requested_at,
        ),
    )


def _create_rejected_run(
    db_path: str | Path,
    *,
    action_key: str,
    site: str,
    task_name: str,
    run_kind: str,
    requested_by: str,
    request_payload: dict[str, Any],
    reason: str,
) -> dict[str, Any]:
    conn = _connect(db_path)
    run_id = str(uuid.uuid4())
    now = _iso_now()
    try:
        _insert_run(
            conn,
            run_id=run_id,
            site=site,
            task_name=task_name,
            action_key=action_key,
            run_kind=run_kind,
            trigger_source="admin",
            requested_by=requested_by,
            status="rejected",
            status_reason=reason,
            request_payload=request_payload,
            requested_at=now,
        )
        conn.commit()
        row = conn.execute("SELECT * FROM crawl_runs WHERE id = ?", (run_id,)).fetchone()
        return _row_to_run(row)
    finally:
        conn.close()


def submit_run_request(
    db_path: str | Path,
    *,
    requested_by: str,
    action_key: str,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    params = dict(params or {})
    if action_key in DENIED_ACTIONS:
        denied = DENIED_ACTIONS[action_key]
        return _create_rejected_run(
            db_path,
            action_key=denied.action_key,
            site=denied.site,
            task_name=denied.task_name,
            run_kind=denied.run_kind,
            requested_by=requested_by,
            request_payload={"params": params},
            reason=denied.reason,
        )

    action = ALLOWED_ACTIONS.get(action_key)
    if action is None:
        raise ControlPlaneValidationError(
            "未知的控制面动作",
            action_key=action_key,
            status_code=400,
            create_rejected_run=False,
        )

    validator = VALIDATORS[action_key]
    try:
        sanitized = validator(action, params)
    except ControlPlaneValidationError as exc:
        return _create_rejected_run(
            db_path,
            action_key=action.action_key,
            site=action.site,
            task_name=action.task_name,
            run_kind=action.run_kind,
            requested_by=requested_by,
            request_payload={"params": params},
            reason=exc.message,
        )
    request_payload = {
        "params": sanitized,
        "maxBackfillDays": BACKFILL_MAX_DAYS,
    }
    conn = _connect(db_path)
    run_id = str(uuid.uuid4())
    now = _iso_now()
    try:
        conn.execute("BEGIN IMMEDIATE")
        conflict = conn.execute(
            """
            SELECT id, status FROM crawl_runs
            WHERE site = ? AND trigger_source = 'admin' AND status IN (?, ?)
            ORDER BY requested_at DESC
            LIMIT 1
            """,
            (action.site, *OPEN_STATUSES),
        ).fetchone()
        if conflict:
            reason = "该站点已有运行中的或待执行的控制面任务"
            _insert_run(
                conn,
                run_id=run_id,
                site=action.site,
                task_name=action.task_name,
                action_key=action.action_key,
                run_kind=action.run_kind,
                trigger_source="admin",
                requested_by=requested_by,
                status="rejected",
                status_reason=reason,
                request_payload=request_payload,
                requested_at=now,
            )
            conn.commit()
            row = conn.execute("SELECT * FROM crawl_runs WHERE id = ?", (run_id,)).fetchone()
            return _row_to_run(row)

        _insert_run(
            conn,
            run_id=run_id,
            site=action.site,
            task_name=action.task_name,
            action_key=action.action_key,
            run_kind=action.run_kind,
            trigger_source="admin",
            requested_by=requested_by,
            status="queued",
            status_reason=None,
            request_payload=request_payload,
            requested_at=now,
        )
        conn.commit()
        row = conn.execute("SELECT * FROM crawl_runs WHERE id = ?", (run_id,)).fetchone()
        return _row_to_run(row)
    finally:
        conn.close()


def recover_orphaned_runs(db_path: str | Path) -> int:
    conn = _connect(db_path)
    now = _iso_now()
    try:
        conn.execute("BEGIN IMMEDIATE")
        rows = conn.execute(
            "SELECT id FROM crawl_runs WHERE status = 'running'"
        ).fetchall()
        count = len(rows)
        if count:
            conn.execute(
                """
                UPDATE crawl_runs
                SET status = 'failed',
                    status_reason = ?,
                    finished_at = COALESCE(finished_at, ?),
                    error_count = COALESCE(error_count, 1)
                WHERE status = 'running'
                """,
                (ORPHANED_RUN_REASON, now),
            )
        conn.execute("DELETE FROM crawl_run_locks")
        conn.commit()
        return count
    finally:
        conn.close()


def claim_next_run(db_path: str | Path) -> dict[str, Any] | None:
    conn = _connect(db_path)
    now = _iso_now()
    try:
        conn.execute("BEGIN IMMEDIATE")
        rows = conn.execute(
            "SELECT * FROM crawl_runs WHERE status = 'queued' ORDER BY requested_at ASC"
        ).fetchall()
        for row in rows:
            try:
                conn.execute(
                    "INSERT INTO crawl_run_locks(site, run_id, acquired_at) VALUES (?, ?, ?)",
                    (row["site"], row["id"], now),
                )
            except sqlite3.IntegrityError:
                continue

            updated = conn.execute(
                """
                UPDATE crawl_runs
                SET status = 'running',
                    started_at = ?,
                    status_reason = NULL
                WHERE id = ? AND status = 'queued'
                """,
                (now, row["id"]),
            )
            if updated.rowcount != 1:
                conn.execute("DELETE FROM crawl_run_locks WHERE site = ?", (row["site"],))
                continue
            conn.commit()
            claimed = conn.execute("SELECT * FROM crawl_runs WHERE id = ?", (row["id"],)).fetchone()
            return _row_to_run(claimed)
        conn.rollback()
        return None
    finally:
        conn.close()


def _release_site_lock(db_path: str | Path, site: str, run_id: str) -> None:
    conn = _connect(db_path)
    try:
        conn.execute(
            "DELETE FROM crawl_run_locks WHERE site = ? AND run_id = ?",
            (site, run_id),
        )
        conn.commit()
    finally:
        conn.close()


def _command_text(command: list[str]) -> str:
    return " ".join(command)


def _execute_subprocess(run: dict[str, Any], action: ActionDefinition, db_path: str | Path) -> dict[str, Any]:
    log_dir = DEFAULT_LOG_DIR
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / f"{run['id']}.log"
    db_str = str(db_path)
    command = action.command_builder(run["requestPayload"]["params"], db_str)
    env = os.environ.copy()
    env.setdefault("PYTHONPATH", str(PROJECT_ROOT))

    with log_path.open("w", encoding="utf-8") as handle:
        handle.write(f"run_id={run['id']}\n")
        handle.write(f"action_key={run['actionKey']}\n")
        handle.write(f"requested_at={run['requestedAt']}\n")
        handle.write(f"params={json.dumps(run['requestPayload']['params'], ensure_ascii=False)}\n\n")
        handle.flush()
        completed = subprocess.run(
            command,
            cwd=str(PROJECT_ROOT),
            stdout=handle,
            stderr=subprocess.STDOUT,
            text=True,
            env=env,
            check=False,
        )

    text = log_path.read_text(encoding="utf-8", errors="replace")
    parsed = action.result_parser(text, completed.returncode)
    return {
        "exitCode": completed.returncode,
        "command": _command_text(command),
        "logPath": str(log_path),
        "result": {
            "logTail": _tail_text(text, lines=20),
        },
        "summary": parsed.get("summary"),
        "fetchedCount": parsed.get("fetchedCount"),
        "upsertedCount": parsed.get("upsertedCount"),
        "errorCount": parsed.get("errorCount"),
    }


def finalize_run_execution(db_path: str | Path, run_id: str, execution: dict[str, Any]) -> None:
    conn = _connect(db_path)
    now = _iso_now()
    try:
        exit_code = execution["exitCode"]
        status = "succeeded" if exit_code == 0 else "failed"
        status_reason = None if exit_code == 0 else execution.get("summary") or "任务执行失败"
        result_payload = dict(execution.get("result") or {})
        result_payload["logPath"] = execution["logPath"]
        conn.execute(
            """
            UPDATE crawl_runs
            SET status = ?,
                status_reason = ?,
                finished_at = ?,
                log_path = ?,
                command = ?,
                exit_code = ?,
                fetched_count = ?,
                upserted_count = ?,
                error_count = ?,
                summary = ?,
                result_payload = ?
            WHERE id = ?
            """,
            (
                status,
                status_reason,
                now,
                execution["logPath"],
                execution["command"],
                exit_code,
                execution.get("fetchedCount"),
                execution.get("upsertedCount"),
                execution.get("errorCount", 0 if exit_code == 0 else 1),
                execution.get("summary"),
                _serialize_json(result_payload),
                run_id,
            ),
        )
        conn.commit()
    finally:
        conn.close()


def execute_claimed_run(db_path: str | Path, run: dict[str, Any]) -> dict[str, Any]:
    action = ALLOWED_ACTIONS[run["actionKey"]]
    try:
        execution = _execute_subprocess(run, action, db_path)
        finalize_run_execution(db_path, run["id"], execution)
        return execution
    finally:
        _release_site_lock(db_path, run["site"], run["id"])


class CrawlControlDispatcher:
    def __init__(self, db_path: str | Path) -> None:
        self.db_path = str(db_path)
        self._stop_event = threading.Event()
        self._thread = threading.Thread(
            target=self._run_loop,
            name="crawl-control-dispatcher",
            daemon=True,
        )

    def start(self) -> None:
        recover_orphaned_runs(self.db_path)
        if not self._thread.is_alive():
            self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread.is_alive():
            self._thread.join(timeout=1.0)

    def _run_loop(self) -> None:
        while not self._stop_event.wait(DISPATCH_INTERVAL_SECONDS):
            try:
                run = claim_next_run(self.db_path)
                if not run:
                    continue
                execute_claimed_run(self.db_path, run)
            except Exception:
                logger.exception("crawl control dispatcher loop failed")


def create_dispatcher(db_path: str | Path) -> CrawlControlDispatcher:
    return CrawlControlDispatcher(db_path)
