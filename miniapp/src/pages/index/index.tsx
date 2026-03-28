import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import AppIcon from '../../components/AppIcon'
import { useProtectedPage } from '../../hooks/useProtectedPage'
import './index.scss'

const CHANNEL_ENTRIES = [
  {
    id: 'construction',
    title: '工程建设',
    path: '/pages/construction/index',
    accent: 'construction',
    icon: 'building',
  },
  {
    id: 'government',
    title: '政府采购',
    path: '/pages/government/index',
    accent: 'government',
    icon: 'banknote',
  },
  {
    id: 'information',
    title: '信息公开',
    path: '/pages/information/index',
    accent: 'information',
    icon: 'filetext',
  },
]

export default function Index() {
  const isAuthorized = useProtectedPage('请先登录后访问首页')
  const windowInfo = Taro.getWindowInfo()
  const menuRect = Taro.getMenuButtonBoundingClientRect
    ? Taro.getMenuButtonBoundingClientRect()
    : null
  const statusBarHeight = windowInfo.statusBarHeight ?? 20
  const navHeight = menuRect
    ? menuRect.height + (menuRect.top - statusBarHeight) * 2
    : 44
  const capsuleSpace = menuRect
    ? Math.max(windowInfo.windowWidth - menuRect.left + 12, 96)
    : 108

  const handleEntryClick = (entry) => {
    Taro.navigateTo({ url: entry.path })
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <View className="page page--tab home-page">
      <View className="home-page__hero" style={{ paddingTop: `${statusBarHeight}px` }}>
        <View
          className="home-page__hero-nav"
          style={{ height: `${navHeight}px`, paddingRight: `${capsuleSpace}px` }}
        />
        <View className="home-page__hero-main">
          <Text className="home-page__hero-title">金堂招讯通</Text>
          <Text className="home-page__hero-subtitle">信息洪流 助推企业拓八方</Text>
          <View className="home-page__hero-bars">
            <View className="home-page__hero-bar home-page__hero-bar--sm" />
            <View className="home-page__hero-bar home-page__hero-bar--lg" />
            <View className="home-page__hero-bar home-page__hero-bar--md" />
            <View className="home-page__hero-bar home-page__hero-bar--xl" />
            <View className="home-page__hero-bar home-page__hero-bar--md" />
          </View>
        </View>
      </View>
      <View className="home-page__body">
        <View className="home-page__entries">
          {CHANNEL_ENTRIES.map((entry) => (
            <View
              key={entry.id}
              className={`home-page__entry-card home-page__entry-card--${entry.accent}`}
              onClick={() => handleEntryClick(entry)}
            >
              <View className="home-page__entry-icon">
                <AppIcon name={entry.icon} size={42} color="#FFFFFF" />
              </View>
              <View className="home-page__entry-content">
                <Text className="home-page__entry-title">{entry.title}</Text>
              </View>
              <View className="home-page__entry-arrow">
                <AppIcon name="chevronright" size={34} color="#C2C9D3" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}
