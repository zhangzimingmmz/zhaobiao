/**
 * 全局日期时间格式化
 * 统一处理 ISO 等格式，输出可读的日期/时间
 */

/**
 * 格式化为日期 YYYY-MM-DD（列表、卡片等简短展示）
 * 兼容 ISO 8601（如 2026-03-17T23:31:59.108327+00:00）及常见日期字符串
 */
export function formatDate(value) {
  if (!value) return ''
  const s = String(value).trim()
  // ISO 格式直接取日期部分，避免小程序环境 Date 解析差异
  if (s.includes('T')) {
    const datePart = s.split('T')[0]
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart
  }
  try {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return s.split(' ')[0] || s
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return s.split(' ')[0] || s
  }
}

/**
 * 格式化为日期时间 YYYY-MM-DD HH:mm（详情、审核等完整展示）
 */
export function formatDateTime(value) {
  if (!value) return ''
  const s = String(value).trim()
  try {
    const d = new Date(s)
    if (Number.isNaN(d.getTime())) return s.replace('T', ' ').split('.')[0] || s
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
  } catch {
    return s.replace('T', ' ').split('.')[0] || s
  }
}
