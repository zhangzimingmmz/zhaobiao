import Taro from '@tarojs/taro'

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

  Taro.setClipboardData({
    data: url,
    success: () => Taro.showToast({ title: copyMessage, icon: 'none' }),
  })
  return true
}
