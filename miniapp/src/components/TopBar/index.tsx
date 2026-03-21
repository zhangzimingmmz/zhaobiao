import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import AppIcon from '../AppIcon'
import './index.scss'

const TAB_SUBTITLE_MAP = {
  金堂招讯通: '一站掌握本地招采与政策资讯',
  收藏: '登录后可跨设备查看账号收藏',
  我的: '账户状态、登录入口与功能管理',
}

function getNavMetrics() {
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

  return {
    statusBarHeight,
    navHeight,
    capsuleSpace,
    totalHeight: statusBarHeight + navHeight,
  }
}

export default function TopBar({
  title = '金堂招讯通',
  showBack,
  right,
  onBack,
  onRight,
  variant = 'secondary',
  actions = [],
  onAction,
}) {
  const resolvedVariant = variant === 'home' ? 'tab' : variant
  const { statusBarHeight, navHeight, capsuleSpace, totalHeight } = getNavMetrics()
  const tabSubtitle = TAB_SUBTITLE_MAP[title] || '本地招采与资讯服务'

  const handleBack = () => {
    if (onBack) onBack()
    else {
      Taro.navigateBack({
        fail: () => {
          Taro.switchTab({ url: '/pages/index/index' })
        },
      })
    }
  }

  const rootStyle = {
    paddingTop: `${statusBarHeight}px`,
    height: `${totalHeight}px`,
    boxSizing: 'border-box',
    '--top-bar-height': `${totalHeight}px`,
  }

  const renderRightAction = () => {
    if (!right) return null

    if (right === 'favorite' || right === 'favorite-active') {
      const heartColor = right === 'favorite-active' ? '#ff4d4f' : '#c9cdd4'

      return (
        <View
          className={
            'top-bar__right' +
            (right === 'favorite-active' ? ' top-bar__right--active' : '')
          }
          onClick={onRight}
        >
          <AppIcon
            name={right === 'favorite-active' ? 'heartfill' : 'heart'}
            size={52}
            color={heartColor}
          />
        </View>
      )
    }

    return (
      <View className="top-bar__right" onClick={onRight}>
        <Text className="top-bar__right-text">
          {right === 'share' ? '分享' : right}
        </Text>
      </View>
    )
  }

  if (resolvedVariant === 'tab') {
    return (
      <View
        className="top-bar top-bar--tab"
        style={rootStyle}
      >
        <View
          className="top-bar__inner top-bar__inner--tab"
          style={{ height: `${navHeight}px`, paddingRight: `${capsuleSpace}px` }}
        >
          <View className="top-bar__tab-copy">
            <Text className="top-bar__subtitle top-bar__subtitle--tab">{tabSubtitle}</Text>
            <Text className="top-bar__title top-bar__title--tab">{title}</Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="top-bar top-bar--secondary" style={rootStyle}>
      <View
        className="top-bar__inner top-bar__inner--secondary"
        style={{ height: `${navHeight}px`, paddingRight: `${capsuleSpace}px` }}
      >
        <View className="top-bar__side top-bar__side--left">
          {showBack && (
            <View className="top-bar__back" onClick={handleBack}>
              <Text className="top-bar__back-text">返回</Text>
            </View>
          )}
        </View>
        <Text className="top-bar__title top-bar__title--secondary">{title}</Text>
        <View className="top-bar__side top-bar__side--right">
          {renderRightAction()}
        </View>
        {actions.length > 0 && (
          <View className="top-bar__legacy-actions">
            {actions.map((action) => (
              <View
                key={action}
                className="top-bar__right"
                onClick={() => onAction && onAction(action)}
              >
                <Text className="top-bar__right-text">{action}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}
