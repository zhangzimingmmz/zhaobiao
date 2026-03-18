import { View } from '@tarojs/components'
import { AtSegmentedControl } from 'taro-ui'
import './index.scss'

const TABS = [
  { id: 'construction', label: '工程建设' },
  { id: 'government', label: '政府采购' },
  { id: 'info', label: '信息展示' },
]

export default function PrimaryTabs({ value, onChange }) {
  const current = TABS.findIndex((t) => t.id === value)
  return (
    <View className="primary-tabs">
      <AtSegmentedControl
        values={TABS.map((t) => t.label)}
        current={current >= 0 ? current : 0}
        onClick={(index) => onChange(TABS[index].id)}
      />
    </View>
  )
}
