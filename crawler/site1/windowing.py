"""
时间窗口工具
- daily_windows: 按天切片
- previous_two_hour_window: 上一完整 2 小时窗口
- last_48h_windows: 最近 48 小时窗口序列
- split_window_to_smaller: 将窗口拆成更小片段
"""
from __future__ import annotations

from datetime import datetime, timedelta

_FMT = "%Y-%m-%d %H:%M:%S"


def _fmt(dt: datetime) -> str:
    return dt.strftime(_FMT)


def daily_windows(
    start_date: str | datetime,
    end_date: str | datetime,
) -> list[tuple[str, str]]:
    """按天切片，左闭右闭（当天 00:00:00 ~ 23:59:59）。

    参数:
        start_date: 起始日期，如 "2026-03-01" 或 datetime
        end_date:   终止日期（含）

    返回:
        [(start_str, end_str), ...]
    """
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date[:10], "%Y-%m-%d")
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date[:10], "%Y-%m-%d")

    windows = []
    current = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
    while current <= end:
        day_start = current
        day_end = current.replace(hour=23, minute=59, second=59)
        windows.append((_fmt(day_start), _fmt(day_end)))
        current += timedelta(days=1)
    return windows


def previous_two_hour_window(now: datetime | None = None) -> tuple[str, str]:
    """返回上一个完整 2 小时窗口。

    例如 now=14:05 → ("12:00:00", "13:59:59")。
    """
    if now is None:
        now = datetime.now()
    hour = now.hour
    # 向下取偶数整点，再往前 2 小时
    current_slot_start = hour - (hour % 2)
    prev_slot_start = current_slot_start - 2
    if prev_slot_start < 0:
        # 跨天
        base = now.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=1)
        prev_slot_start += 24
    else:
        base = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start = base + timedelta(hours=prev_slot_start)
    end = start + timedelta(hours=2) - timedelta(seconds=1)
    return (_fmt(start), _fmt(end))


def last_48h_windows(
    now: datetime | None = None,
    step_hours: int = 2,
) -> list[tuple[str, str]]:
    """返回最近 48 小时内的窗口序列（每段 step_hours 小时）。

    按时间正序排列，最后一个窗口不超过 now。
    """
    if now is None:
        now = datetime.now()
    cutoff = now - timedelta(hours=48)
    # 对齐到 step_hours 的整数倍
    base_hour = cutoff.hour - (cutoff.hour % step_hours)
    current = cutoff.replace(hour=base_hour, minute=0, second=0, microsecond=0)
    windows = []
    while current < now:
        seg_start = current
        seg_end = current + timedelta(hours=step_hours) - timedelta(seconds=1)
        if seg_end > now:
            seg_end = now.replace(microsecond=0)
        windows.append((_fmt(seg_start), _fmt(seg_end)))
        current += timedelta(hours=step_hours)
    return windows


def split_window_to_smaller(
    start_time: str,
    end_time: str,
    parts: int = 2,
) -> list[tuple[str, str]]:
    """将一个时间窗口等分成 parts 段（默认对半拆）。

    若窗口 < 2 秒则不再拆分，直接返回原窗口。
    """
    start = datetime.strptime(start_time, _FMT)
    end = datetime.strptime(end_time, _FMT)
    duration = (end - start).total_seconds()
    if duration < 2:
        return [(start_time, end_time)]
    seg = duration / parts
    windows = []
    for i in range(parts):
        seg_start = start + timedelta(seconds=i * seg)
        seg_end = start + timedelta(seconds=(i + 1) * seg) - timedelta(seconds=1)
        if i == parts - 1:
            seg_end = end
        windows.append((_fmt(seg_start), _fmt(seg_end)))
    return windows
