import { View, Text } from '@tarojs/components'
import './index.scss'

const TABS = [
  { id: 'construction', label: '工程建设' },
  { id: 'government', label: '政府采购' },
  { id: 'info', label: '信息展示' },
]

export default function PrimaryTabs({ value, onChange }) {
  return (
    <View className="primary-tabs">
      <View className="primary-tabs__rail">
        {TABS.map((tab) => {
          const active = tab.id === value
          return (
            <View
              key={tab.id}
              className={'primary-tabs__item' + (active ? ' primary-tabs__item--active' : '')}
              onClick={() => onChange(tab.id)}
            >
              <Text className="primary-tabs__label">{tab.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
