import { View, Text } from '@tarojs/components'
import './index.scss'

export default function EmptyState({
  text = '',
  title = '暂无数据',
  description = '',
  tone = 'default',
}) {
  return (
    <View className={'empty-state' + (tone === 'error' ? ' empty-state--error' : '')}>
      <Text className="empty-state__title">{text || title}</Text>
      {description ? <Text className="empty-state__description">{description}</Text> : null}
    </View>
  )
}
