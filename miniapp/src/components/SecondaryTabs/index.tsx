import { View } from '@tarojs/components'
import { AtSegmentedControl } from 'taro-ui'
import './index.scss'

export default function SecondaryTabs({ tabs, value, onChange }) {
  if (!tabs || tabs.length === 0) return null
  const current = tabs.findIndex((t) => t.id === value)
  return (
    <View className="secondary-tabs">
      <AtSegmentedControl
        values={tabs.map((t) => t.label)}
        current={current >= 0 ? current : 0}
        onClick={(index) => onChange(tabs[index].id)}
      />
    </View>
  )
}
