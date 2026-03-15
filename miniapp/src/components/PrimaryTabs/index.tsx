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
      {TABS.map((tab) => (
        <View
          key={tab.id}
          className={'primary-tabs__item' + (value === tab.id ? ' primary-tabs__item--active' : '')}
          onClick={() => onChange(tab.id)}
        >
          <Text>{tab.label}</Text>
        </View>
      ))}
    </View>
  )
}
