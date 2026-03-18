import Taro from '@tarojs/taro'
import { formatDate } from './formatDate'

const FAVORITES_STORAGE_KEY = 'favorites_records'
const FAVORITES_TYPE_KEY = 'favorites_selected_type'

const NATURE_LABELS = {
  '1': '货物',
  '2': '工程',
  '3': '服务',
}

const METHOD_LABELS = {
  '1': '公开招标',
  '2': '邀请招标',
  '3': '竞争性谈判',
  '4': '询价',
  '5': '单一来源',
  '6': '竞争性磋商',
}

const CATEGORY_TYPE_MAP = {
  '002001009': 'construction',
  '002001001': 'construction',
  '002002001': 'government',
  '59': 'government',
  '00101': 'government',
}

function formatBudget(value) {
  if (!value) return ''
  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)
  return `${(amount / 10000).toFixed(2)}万元`
}

function buildFavoriteKey(record) {
  return `${record.viewType || 'bid'}:${record.id}`
}

export function inferFavoritesType(record) {
  const categoryNum = record.categoryNum || record.noticeType || ''
  return CATEGORY_TYPE_MAP[categoryNum] || 'info'
}

export function normalizeFavoriteRecord(record, overrides = {}) {
  const viewType = overrides.viewType || record.viewType || 'bid'
  const categoryNum = overrides.categoryNum || record.categoryNum || record.noticeType || ''

  return {
    id: record.id,
    title: record.title || '',
    categoryNum,
    categoryLabel: overrides.categoryLabel || record.categoryLabel || record.categoryName || '',
    natureLabel:
      overrides.natureLabel ||
      record.natureLabel ||
      (record.purchaseNature ? NATURE_LABELS[record.purchaseNature] || '' : ''),
    methodLabel:
      overrides.methodLabel ||
      record.methodLabel ||
      (record.purchaseManner ? METHOD_LABELS[record.purchaseManner] || '' : ''),
    budgetLabel: overrides.budgetLabel || record.budgetLabel || formatBudget(record.budget),
    purchaser: overrides.purchaser || record.purchaser || record.tenderer || '',
    regionName: overrides.regionName || record.regionName || record.location || '',
    sourceName: overrides.sourceName || record.sourceName || record.zhuanzai || record.author || '',
    deadlineLabel:
      overrides.deadlineLabel ||
      record.deadlineLabel ||
      formatDate(record.expireTime || record.openTenderTime || record.enrollEnd || ''),
    publishLabel:
      overrides.publishLabel ||
      record.publishLabel ||
      formatDate(record.publishTime || record.webdate || record.noticeTime || ''),
    summary: overrides.summary || record.summary || record.description || '',
    cover: overrides.cover || record.cover || '',
    viewType,
    favoritesType: overrides.favoritesType || inferFavoritesType({ ...record, categoryNum }),
    favoriteKey: overrides.favoriteKey || buildFavoriteKey({ ...record, viewType }),
    savedAt: overrides.savedAt || new Date().toISOString(),
  }
}

export function readFavoriteRecords() {
  const records = Taro.getStorageSync(FAVORITES_STORAGE_KEY)
  return Array.isArray(records) ? records : []
}

function writeFavoriteRecords(records) {
  Taro.setStorageSync(FAVORITES_STORAGE_KEY, records)
}

export function isFavoriteRecord(recordOrId, viewType = 'bid') {
  const key =
    typeof recordOrId === 'string'
      ? `${viewType}:${recordOrId}`
      : recordOrId.favoriteKey || buildFavoriteKey(recordOrId)
  return readFavoriteRecords().some((record) => record.favoriteKey === key)
}

export function saveFavoriteRecord(record, overrides = {}) {
  const normalized = normalizeFavoriteRecord(record, overrides)
  const nextRecords = [
    normalized,
    ...readFavoriteRecords().filter((item) => item.favoriteKey !== normalized.favoriteKey),
  ]
  writeFavoriteRecords(nextRecords)
  return normalized
}

export function removeFavoriteRecord(recordOrId, viewType = 'bid') {
  const key =
    typeof recordOrId === 'string'
      ? `${viewType}:${recordOrId}`
      : recordOrId.favoriteKey || buildFavoriteKey(recordOrId)
  writeFavoriteRecords(readFavoriteRecords().filter((record) => record.favoriteKey !== key))
}

export function getFavoriteTypeSelection() {
  return Taro.getStorageSync(FAVORITES_TYPE_KEY) || 'construction'
}

export function setFavoriteTypeSelection(type) {
  Taro.setStorageSync(FAVORITES_TYPE_KEY, type)
}
