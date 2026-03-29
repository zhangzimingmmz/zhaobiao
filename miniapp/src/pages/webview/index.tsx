import { View, WebView, Text } from '@tarojs/components'
import { useRouter } from '@tarojs/taro'
import { useState } from 'react'
import TopBar from '../../components/TopBar'
import './index.scss'

export default function WebViewPage() {
  const router = useRouter()
  const { url } = router.params
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const articleUrl = url ? decodeURIComponent(url) : ''

  const handleLoad = () => {
    setLoading(false)
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
  }

  if (!articleUrl) {
    return (
      <View className="page page--secondary webview-page">
        <TopBar title="原文" showBack variant="secondary" />
        <View className="webview-page__body">
          <View className="error-state">
            <View className="error-text">文章链接无效</View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="page page--secondary webview-page">
      <TopBar title="原文" showBack variant="secondary" />
      <View className="webview-page__body">
      {loading && (
        <View className="loading-state">
          <View className="loading-text">加载中...</View>
        </View>
      )}
      {error && (
        <View className="error-state">
          <View className="error-text">加载失败，请稍后重试</View>
        </View>
      )}
      <WebView
        src={articleUrl}
        onLoad={handleLoad}
        onError={handleError}
        className="webview-page__iframe"
      />
      </View>
    </View>
  )
}
