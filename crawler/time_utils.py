from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

SOURCE_TZ = ZoneInfo("Asia/Shanghai")


def to_source_naive(value: datetime) -> datetime:
    """Convert a datetime instant to source-site wall time without tzinfo."""
    if value.tzinfo is None:
        return value
    return value.astimezone(SOURCE_TZ).replace(tzinfo=None)


def source_now() -> datetime:
    """Return current source-site wall time as a naive datetime."""
    return datetime.now(SOURCE_TZ).replace(tzinfo=None)


def source_date_str(value: datetime | None = None) -> str:
    """Return YYYY-MM-DD in the source site's timezone."""
    source_time = to_source_naive(value) if value is not None else source_now()
    return source_time.strftime("%Y-%m-%d")
