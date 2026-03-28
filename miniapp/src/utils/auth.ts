import Taro from '@tarojs/taro'

export const LOGIN_PAGE_URL = '/pages/login/index'
export const HOME_PAGE_URL = '/pages/index/index'

export function hasAuthToken() {
  return Boolean(Taro.getStorageSync('token'))
}

export function promptLoginToViewDetail() {
  Taro.showToast({ title: '请先登录后查看详情', icon: 'none' })
}

export function routeGuestToLogin(message = '请先登录后查看详情', delay = 350) {
  if (message) {
    Taro.showToast({ title: message, icon: 'none', duration: 1500 })
  }

  setTimeout(() => {
    Taro.reLaunch({ url: LOGIN_PAGE_URL })
  }, delay)
}
