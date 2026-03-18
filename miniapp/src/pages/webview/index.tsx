import { View, WebView, Text } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useState } from 'react'
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
      <View className='webview-page'>
        <View className='error-state'>
          <View className='error-text'>文章链接无效</View>
        </View>
      </View>
    )
  }

  return (
    <View className='webview-page'>
      <View className='webview-page__header' onClick={() => Taro.navigateBack()}>
        <Text className='webview-page__back'>← 返回</Text>
      </View>
      {loading && (
        <View className='loading-state'>
          <View className='loading-text'>加载中...</View>
        </View>
      )}
      {error && (
        <View className='error-state'>
          <View className='error-text'>加载失败，请稍后重试</View>
        </View>
      )}
      <WebView
        src={articleUrl}
        onLoad={handleLoad}
        onError={handleError}
        className="webview-page__iframe"
      />
    </View>
  )
}
