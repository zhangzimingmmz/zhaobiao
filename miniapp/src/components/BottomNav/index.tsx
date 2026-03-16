import { View, Text } from '@tarojs/components'
import AppIcon from '../AppIcon'
import './index.scss'

export default function BottomNav({
  active = 'home',
  onChange,
}) {
  const items = [
    { key: 'home', label: '首页', icon: 'home' },
    { key: 'favorites', label: '收藏', icon: 'heart' },
    { key: 'profile', label: '我的', icon: 'user' },
  ]

  return (
    <View className="bottom-nav">
      <View className="bottom-nav__inner">
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <View
              key={item.key}
              className={'bottom-nav__item' + (isActive ? ' bottom-nav__item--active' : '')}
              onClick={() => onChange && onChange(item.key)}
            >
              <AppIcon
                name={item.icon}
                size={56}
                color={isActive ? '#1677FF' : '#4E5969'}
              />
              <Text className="bottom-nav__label">{item.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
