import { useMemo, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AtButton } from 'taro-ui'
import SecondaryTabs from '../../components/SecondaryTabs'
import TopBar from '../../components/TopBar'
import BidCard from '../../components/BidCard'
import InfoCard from '../../components/InfoCard'
import EmptyState from '../../components/EmptyState'
import { api } from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import { getFavoriteTypeSelection, setFavoriteTypeSelection } from '../../utils/favorites'
import './index.scss'

const FAVORITES_TABS = [
  { id: 'construction', label: '工程建设' },
  { id: 'government', label: '政府采购' },
  { id: 'info', label: '信息展示' },
]

function normalizeFavoriteItem(item) {
  if (item.viewType === 'info') {
    return {
      ...item,
      cover: item.coverImageUrl || '',
      publishLabel: formatDate(item.publishTime),
    }
  }

  return {
    ...item,
    categoryLabel: item.categoryName || item.categoryLabel || '',
    publishLabel: formatDate(item.publishTime),
  }
}

export default function Favorites() {
  const [selectedType, setSelectedType] = useState(getFavoriteTypeSelection())
  const [records, setRecords] = useState([])
  const [isLoggedIn, setIsLoggedIn] = useState(!!Taro.getStorageSync('token'))
  const [loading, setLoading] = useState(false)

  const loadFavorites = () => {
    if (!Taro.getStorageSync('token')) {
      setRecords([])
      return
    }

    setLoading(true)
    api.getFavorites({ page: 1, pageSize: 200 })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          setRecords(res.data.data.list || [])
          return
        }
        setRecords([])
        Taro.showToast({ title: res.data?.message || '收藏加载失败', icon: 'none' })
      })
      .catch(() => {
        setRecords([])
        Taro.showToast({ title: '收藏加载失败', icon: 'none' })
      })
      .finally(() => setLoading(false))
  }

  useDidShow(() => {
    setSelectedType(getFavoriteTypeSelection())
    const loggedIn = !!Taro.getStorageSync('token')
    setIsLoggedIn(loggedIn)
    if (loggedIn) {
      loadFavorites()
    } else {
      setRecords([])
    }
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

  const handleFavoriteToggle = (item) => {
    api.toggleFavorite({
      targetId: item.id,
      targetType: item.viewType || 'bid',
      targetSite: item.site || undefined,
    })
      .then((res) => {
        if (res.data?.code === 200) {
          setRecords((prev) =>
            prev.filter((record) => !(record.id === item.id && (record.site || '') === (item.site || ''))),
          )
          Taro.showToast({ title: '已取消收藏', icon: 'none' })
          return
        }
        Taro.showToast({ title: res.data?.message || '操作失败，请重试', icon: 'none' })
      })
      .catch(() => Taro.showToast({ title: '操作失败，请重试', icon: 'none' }))
  }

  const renderGuestBanner = () => (
    <View className="favorites-page__banner">
      <Text className="favorites-page__banner-title">登录后查看收藏</Text>
      <Text className="favorites-page__banner-desc">收藏已改为账号级服务端数据。请先登录后查看和管理收藏内容。</Text>
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

        {loading ? (
          <EmptyState
            title="收藏加载中"
            description="正在从服务端同步当前账号的收藏数据。"
          />
        ) : visibleRecords.length === 0 ? (
          <EmptyState
            title={isLoggedIn ? '当前分类暂无收藏' : '还没有收藏内容'}
            description={
              isLoggedIn
                ? '你可以先去首页浏览内容，收藏后会出现在当前分类下。'
                : '登录后可查看账号下的收藏列表。'
            }
          />
        ) : (
          visibleRecords.map((item) => {
            const normalized = normalizeFavoriteItem(item)
            const key = `${normalized.viewType}:${normalized.site || ''}:${normalized.id}`
            if (normalized.viewType === 'info') {
              return (
                <InfoCard
                  key={key}
                  item={normalized}
                  onClick={handleCardClick}
                  onFavoriteToggle={handleFavoriteToggle}
                  favorited
                />
              )
            }

            return (
              <BidCard
                key={key}
                item={normalized}
                onClick={handleCardClick}
                onFavoriteToggle={handleFavoriteToggle}
                favorited
              />
            )
          })
        )}
      </View>
    </View>
  )
}
