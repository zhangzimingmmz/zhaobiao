import Taro from '@tarojs/taro'

const APPLICATION_ID_KEY = 'registrationApplicationId'
const APPLICATION_USERNAME_KEY = 'registrationUsername'
const APPLICATION_MOBILE_KEY = 'registrationMobile'

export function saveRegistrationContext({ applicationId, username, mobile }) {
  if (applicationId) Taro.setStorageSync(APPLICATION_ID_KEY, applicationId)
  if (username) Taro.setStorageSync(APPLICATION_USERNAME_KEY, username)
  if (mobile) Taro.setStorageSync(APPLICATION_MOBILE_KEY, mobile)
}

export function getRegistrationContext() {
  return {
    applicationId: Taro.getStorageSync(APPLICATION_ID_KEY) || '',
    username: Taro.getStorageSync(APPLICATION_USERNAME_KEY) || '',
    mobile: Taro.getStorageSync(APPLICATION_MOBILE_KEY) || '',
  }
}

export function clearRegistrationContext() {
  Taro.removeStorageSync(APPLICATION_ID_KEY)
  Taro.removeStorageSync(APPLICATION_USERNAME_KEY)
  Taro.removeStorageSync(APPLICATION_MOBILE_KEY)
}
