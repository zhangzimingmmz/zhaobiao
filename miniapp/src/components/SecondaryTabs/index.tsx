import { View, Text } from '@tarojs/components'
import './index.scss'

export default function SecondaryTabs({ tabs, value, onChange }) {
  if (!tabs || tabs.length === 0) return null
  return (
    <View className="secondary-tabs">
      <View
        className="secondary-tabs__list"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const active = tab.id === value
          return (
            <View
              key={tab.id}
              className={'secondary-tabs__item' + (active ? ' secondary-tabs__item--active' : '')}
              onClick={() => onChange(tab.id)}
            >
              <Text className="secondary-tabs__label">{tab.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
