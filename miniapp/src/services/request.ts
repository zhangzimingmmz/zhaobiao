/**
 * 请求封装，与 docs/接口文档-前端与小程序.md 约定一致
 * Base URL 通过环境或 config 注入
 */
import Taro from '@tarojs/taro'
import { config } from '../config'

const BASE_URL = config.baseUrl

export function request(options) {
  const token = Taro.getStorageSync('token') || ''
  return Taro.request({
    ...options,
    url: (options.url.startsWith('http') ? options.url : BASE_URL + options.url),
    header: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.header,
    },
    timeout: options.timeout || 10000,
  })
}

export function get(url, data) {
  // 过滤 undefined，避免序列化为 "undefined" 字符串导致后端误匹配
  const filtered =
    data && typeof data === 'object'
      ? Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '')
        )
      : undefined
  return request({ method: 'GET', url, data: filtered })
}

export function post(url, data) {
  return request({ method: 'POST', url, data })
}
