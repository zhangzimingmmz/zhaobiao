/**
 * 全局日期时间格式化
 * 统一处理 ISO 等格式，输出可读的日期/时间
 */

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

function pad(value) {
  return String(value).padStart(2, '0')
}

function isLocalDateTimeString(value) {
  return /^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.test(value)
}

function datePart(value) {
  return String(value || '').trim().slice(0, 10)
}

function beijingPartsFromInstant(value) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const shifted = new Date(date.getTime() + BEIJING_OFFSET_MS)
  return {
    y: shifted.getUTCFullYear(),
    m: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    min: shifted.getUTCMinutes(),
  }
}

function formatPartsDate(parts) {
  return `${parts.y}-${pad(parts.m)}-${pad(parts.d)}`
}

function addDays(dateText, days) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText)
  if (!match) return dateText
  const base = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const date = new Date(base + days * DAY_MS)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

export function formatBeijingDate(value = new Date()) {
  const s = String(value || '').trim()
  if (s && isLocalDateTimeString(s)) return datePart(s)
  const parts = beijingPartsFromInstant(value)
  return parts ? formatPartsDate(parts) : (s.split(' ')[0] || s)
}

export function buildBeijingTimeFilter(value, now = new Date()) {
  if (!value) return {}
  if (value.includes('|')) {
    const [start, end] = value.split('|')
    return {
      timeStart: start ? `${start} 00:00:00` : undefined,
      timeEnd: end ? `${end} 23:59:59` : undefined,
    }
  }

  const today = formatBeijingDate(now)
  const ranges = { today: 0, '3d': -2, '7d': -6, '30d': -29 }
  if (!(value in ranges)) return {}
  const start = addDays(today, ranges[value])
  return { timeStart: `${start} 00:00:00`, timeEnd: `${today} 23:59:59` }
}

/**
 * 格式化为日期 YYYY-MM-DD（列表、卡片等简短展示）
 * 兼容 ISO 8601（如 2026-03-17T23:31:59.108327+00:00）及常见日期字符串
 */
export function formatDate(value) {
  if (!value) return ''
  const s = String(value).trim()
  return formatBeijingDate(s)
}

/**
 * 格式化为日期时间 YYYY-MM-DD HH:mm（详情、审核等完整展示）
 */
export function formatDateTime(value) {
  if (!value) return ''
  const s = String(value).trim()
  if (isLocalDateTimeString(s)) {
    return s.replace('T', ' ').slice(0, 16)
  }
  const parts = beijingPartsFromInstant(s)
  if (!parts) return s.replace('T', ' ').split('.')[0] || s
  return `${formatPartsDate(parts)} ${pad(parts.h)}:${pad(parts.min)}`
}
