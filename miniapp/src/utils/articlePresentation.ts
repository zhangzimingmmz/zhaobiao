import Taro from '@tarojs/taro'
import { config } from '../config'

const WEBVIEW_ALLOWED_HOSTS = new Set([
  'ggzyjy.sc.gov.cn',
  'www.ccgp-sichuan.gov.cn',
])

function resolveHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function buildWebViewProxyUrl(url) {
  return `${config.baseUrl}/api/webview-proxy?url=${encodeURIComponent(url)}`
}

export function canOpenOriginalInMiniapp(url) {
  if (!url) return false
  if (/^https:\/\/mp\.weixin\.qq\.com\//.test(url)) return true
  return WEBVIEW_ALLOWED_HOSTS.has(resolveHostname(url))
}

export function copyOriginalLink(url, copyMessage = '原文链接已复制，请在浏览器中打开') {
  if (!url) return false

  Taro.setClipboardData({
    data: url,
    success: () => Taro.showToast({ title: copyMessage, icon: 'none' }),
  })
  return true
}

export function normalizeArticleCoverUrl(input) {
  if (typeof input !== 'string') return ''
  const value = input.trim()
  if (!value || value === 'null' || value === 'undefined') return ''
  if (/^https?:\/\//.test(value)) return value
  return ''
}

export function openArticleOriginal(url, copyMessage = '原文链接已复制，请在浏览器中打开') {
  if (!url) return false

  if (/^https:\/\/mp\.weixin\.qq\.com\//.test(url)) {
    const wxApi = typeof wx !== 'undefined' ? wx : null
    if (wxApi?.openOfficialAccountArticle) {
      wxApi.openOfficialAccountArticle({
        url,
        fail: () => {
          Taro.setClipboardData({
            data: url,
            success: () => Taro.showToast({ title: '链接已复制，请在浏览器中打开', icon: 'none' }),
          })
        },
      })
      return true
    }
  }

  if (WEBVIEW_ALLOWED_HOSTS.has(resolveHostname(url))) {
    const webviewUrl = buildWebViewProxyUrl(url)
    Taro.navigateTo({
      url: `/pages/webview/index?url=${encodeURIComponent(webviewUrl)}`,
    })
    return true
  }

  return copyOriginalLink(url, copyMessage)
}
