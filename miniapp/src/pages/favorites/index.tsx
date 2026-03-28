import { useMemo, useState } from 'react'
import { View } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import SecondaryTabs from '../../components/SecondaryTabs'
import TopBar from '../../components/TopBar'
import BidCard from '../../components/BidCard'
import InfoCard from '../../components/InfoCard'
import EmptyState from '../../components/EmptyState'
import { api } from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import { normalizeArticleCoverUrl, openArticleOriginal } from '../../utils/articlePresentation'
import { getFavoriteTypeSelection, setFavoriteTypeSelection } from '../../utils/favorites'
import { useProtectedPage } from '../../hooks/useProtectedPage'
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
      cover: normalizeArticleCoverUrl(item.coverImageUrl || item.cover || ''),
      originUrl: item.originUrl || item.wechatArticleUrl || '',
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
  const isAuthorized = useProtectedPage('请先登录后查看收藏')
  const [selectedType, setSelectedType] = useState(getFavoriteTypeSelection())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)

  const loadFavorites = () => {
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
    if (isAuthorized) {
      loadFavorites()
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
      if (item.originUrl) {
        api.recordArticleView(item.id).catch(() => {})
        openArticleOriginal(item.originUrl)
        return
      }
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

  if (!isAuthorized) {
    return null
  }

  return (
    <View className="page page--tab favorites-page">
      <TopBar title="收藏" variant="tab" />
      <View className="favorites-page__section">
        <View className="favorites-page__switch">
          <SecondaryTabs
            tabs={FAVORITES_TABS}
            value={selectedType}
            onChange={handleTypeChange}
          />
        </View>
        <View className="favorites-page__content">
          {loading ? (
            <EmptyState
              title="收藏加载中"
              description="正在从服务端同步当前账号的收藏数据。"
            />
          ) : visibleRecords.length === 0 ? (
            <EmptyState
              title="当前分类暂无收藏"
              description="你可以先去首页浏览内容，收藏后会出现在当前分类下。"
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
    </View>
  )
}
