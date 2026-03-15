import { View, Text } from '@tarojs/components'
import './index.scss'

export default function SecondaryTabs({ tabs, value, onChange }) {
  if (!tabs || tabs.length === 0) return null
  return (
    <View className="secondary-tabs">
      {tabs.map((tab) => (
        <View
          key={tab.id}
          className={'secondary-tabs__item' + (value === tab.id ? ' secondary-tabs__item--active' : '')}
          onClick={() => onChange(tab.id)}
        >
          <Text>{tab.label}</Text>
        </View>
      ))}
    </View>
  )
}
