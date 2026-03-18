import { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AtButton } from 'taro-ui'
import SecondaryTabs from '../../components/SecondaryTabs'
import TopBar from '../../components/TopBar'
import BidCard from '../../components/BidCard'
import InfoCard from '../../components/InfoCard'
import EmptyState from '../../components/EmptyState'
import {
  getFavoriteTypeSelection,
  readFavoriteRecords,
  setFavoriteTypeSelection,
} from '../../utils/favorites'
import './index.scss'

const FAVORITES_TABS = [
  { id: 'construction', label: '工程建设' },
  { id: 'government', label: '政府采购' },
  { id: 'info', label: '信息展示' },
]

export default function Favorites() {
  const [selectedType, setSelectedType] = useState(getFavoriteTypeSelection())
  const [records, setRecords] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!Taro.getStorageSync('token'))

  useDidShow(() => {
    setSelectedType(getFavoriteTypeSelection())
    setRecords(readFavoriteRecords())
    setIsLoggedIn(!!Taro.getStorageSync('token'))
  })

  const visibleRecords = useMemo(
    () => records.filter((record) => record.favoritesType === selectedType),
    [records, selectedType],
  )

  const handleTypeChange = (type) => {
    setSelectedType(type)
    setFavoriteTypeSelection(type)
  }

  const handleCardClick = (item) => {
    if (item.viewType === 'info') {
      Taro.navigateTo({ url: `/pages/info-detail/index?id=${item.id}` })
      return
    }
    Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` })
  }

  const renderGuestBanner = () => (
    <View className="favorites-page__banner">
      <Text className="favorites-page__banner-title">登录后可同步收藏</Text>
      <Text className="favorites-page__banner-desc">当前收藏保存在本机，登录后可继续完善账号信息与后续同步能力。</Text>
      <AtButton
        type="primary"
        full
        className="favorites-page__banner-action"
        onClick={() => Taro.navigateTo({ url: '/pages/login/index' })}
      >
        去登录
      </AtButton>
    </View>
  )

  return (
    <View className="page page--tab favorites-page">
      <TopBar title="收藏" variant="tab" />
      <SecondaryTabs
        tabs={FAVORITES_TABS}
        value={selectedType}
        onChange={handleTypeChange}
      />
      <View className="favorites-page__content">
        {!isLoggedIn && renderGuestBanner()}

        {visibleRecords.length === 0 ? (
          <EmptyState
            title={isLoggedIn ? '当前分类暂无收藏' : '还没有收藏内容'}
            description={
              isLoggedIn
                ? '你可以先去首页浏览内容，收藏后会出现在当前分类下。'
                : '你可以先浏览并收藏内容，登录后也能继续保留当前设备上的收藏。'
            }
          />
        ) : (
          visibleRecords.map((item) =>
            item.viewType === 'info' ? (
              <InfoCard key={item.favoriteKey} item={item} onClick={handleCardClick} />
            ) : (
              <BidCard key={item.favoriteKey} item={item} onClick={handleCardClick} />
            ),
          )
        )}
      </View>
    </View>
  )
}
