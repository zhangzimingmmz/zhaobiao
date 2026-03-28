import Taro from '@tarojs/taro'

const FAVORITES_TYPE_KEY = 'favorites_selected_type'

const CATEGORY_TYPE_MAP = {
  '002001009': 'construction',
  '002001010': 'construction',
  '002001001': 'construction',
  '002002001': 'government',
  '59': 'government',
  '00101': 'government',
}

export function inferFavoritesType(record) {
  const categoryNum = record.categoryNum || record.noticeType || ''
  return CATEGORY_TYPE_MAP[categoryNum] || 'info'
}

export function getFavoriteTypeSelection() {
  return Taro.getStorageSync(FAVORITES_TYPE_KEY) || 'construction'
}

export function setFavoriteTypeSelection(type) {
  Taro.setStorageSync(FAVORITES_TYPE_KEY, type)
}
