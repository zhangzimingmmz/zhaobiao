export const BEIJING_TIME_ZONE = "Asia/Shanghai";

type TimeFormatOptions = {
  includeYear?: boolean;
  includeSeconds?: boolean;
};

type LocalDateTimeParts = {
  year: string;
  month: string;
  day: string;
  hour?: string;
  minute?: string;
  second?: string;
};

const LOCAL_DATE_TIME_RE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/;

function parseLocalDateTime(value?: string | Date | null): LocalDateTimeParts | null {
  if (typeof value !== "string") return null;
  const match = LOCAL_DATE_TIME_RE.exec(value.trim());
  if (!match) return null;
  return {
    year: match[1],
    month: match[2],
    day: match[3],
    hour: match[4],
    minute: match[5],
    second: match[6],
  };
}

function normalize(value?: string | Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clean(value: string): string {
  return value.replace(/\//g, "-");
}

function localDate(parts: LocalDateTimeParts, includeYear = true): string {
  return includeYear
    ? `${parts.year}-${parts.month}-${parts.day}`
    : `${parts.month}-${parts.day}`;
}

function localTime(parts: LocalDateTimeParts, includeSeconds = false): string | null {
  if (!parts.hour || !parts.minute) return null;
  const base = `${parts.hour}:${parts.minute}`;
  if (!includeSeconds) return base;
  return `${base}:${parts.second ?? "00"}`;
}

export function formatBeijingDate(value?: string | Date | null): string {
  const local = parseLocalDateTime(value);
  if (local) return localDate(local);

  const date = normalize(value);
  if (!date) return value ? String(value) : "-";
  return clean(
    date.toLocaleDateString("zh-CN", {
      timeZone: BEIJING_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  );
}

export function formatBeijingTime(value?: string | Date | null): string {
  const local = parseLocalDateTime(value);
  if (local) return localTime(local) ?? "-";

  const date = normalize(value);
  if (!date) return value ? String(value) : "-";
  return date.toLocaleTimeString("zh-CN", {
    timeZone: BEIJING_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatBeijingDateTime(
  value?: string | Date | null,
  options: TimeFormatOptions = {},
): string {
  const local = parseLocalDateTime(value);
  if (local) {
    const date = localDate(local, options.includeYear !== false);
    const time = localTime(local, options.includeSeconds);
    return time ? `${date} ${time}` : date;
  }

  const date = normalize(value);
  if (!date) return value ? String(value) : "-";
  return clean(
    date.toLocaleString("zh-CN", {
      timeZone: BEIJING_TIME_ZONE,
      year: options.includeYear === false ? undefined : "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: options.includeSeconds ? "2-digit" : undefined,
      hour12: false,
    }),
  );
}

export function beijingToday(): string {
  return formatBeijingDate(new Date());
}
