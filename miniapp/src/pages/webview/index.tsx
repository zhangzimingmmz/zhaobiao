import { View, Text, WebView } from '@tarojs/components'
import Taro from '@tarojs/taro'

export default function WebviewPage() {
  const url = Taro.getCurrentInstance().router?.params?.url || ''
  const decodedUrl = url ? decodeURIComponent(url) : ''

  if (!decodedUrl) {
    return (
      <View style={{ padding: 32, textAlign: 'center', color: '#86909C' }}>
        <Text>暂无原文链接</Text>
      </View>
    )
  }

  return <WebView src={decodedUrl} />
}
