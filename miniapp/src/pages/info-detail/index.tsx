import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import {
  inferFavoritesType,
  isFavoriteRecord,
  removeFavoriteRecord,
  saveFavoriteRecord,
} from '../../utils/favorites'
import { formatDate } from '../../utils/formatDate'
import './index.scss'

export default function InfoDetail() {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const id = Taro.getCurrentInstance().router?.params?.id || ''

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    api.detailInfo(id)
      .then((res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          setDetail(res.data.data)
          setFavorited(isFavoriteRecord(res.data.data.id, 'info'))
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleViewOriginal = () => {
    if (detail && detail.originUrl) {
      Taro.navigateTo({
        url: '/pages/webview/index?url=' + encodeURIComponent(detail.originUrl),
      })
    }
  }

  const handleShare = () => {
    if (!detail) return

    const sharePayload = detail.originUrl || detail.title
    Taro.setClipboardData({ data: sharePayload })
    Taro.showToast({ title: detail.originUrl ? '原文链接已复制' : '标题已复制', icon: 'none' })
  }

  const handleFavoriteToggle = () => {
    if (!detail) return

    if (favorited) {
      removeFavoriteRecord(detail.id, 'info')
      setFavorited(false)
      Taro.showToast({ title: '已取消收藏', icon: 'none' })
      return
    }

    const favoritesType = inferFavoritesType({ ...detail, viewType: 'info' })
    saveFavoriteRecord(detail, { viewType: 'info', favoritesType })
    setFavorited(true)
    Taro.showToast({ title: '已加入收藏', icon: 'none' })
  }

  if (loading) {
    return (
      <View className="page page--secondary info-detail-page">
        <TopBar title="信息详情" showBack right="favorite" variant="secondary" />
        <View className="info-detail-page__loading"><Text>加载中...</Text></View>
      </View>
    )
  }
  if (!detail) {
    return (
      <View className="page page--secondary info-detail-page">
        <TopBar title="信息详情" showBack variant="secondary" />
        <View className="info-detail-page__empty"><Text>暂无内容</Text></View>
      </View>
    )
  }

  return (
    <View className="page page--secondary info-detail-page">
      <TopBar
        title="信息详情"
        showBack
        right={favorited ? 'favorite-active' : 'favorite'}
        variant="secondary"
        onRight={handleFavoriteToggle}
        actions={['分享']}
        onAction={(action) => action === '分享' && handleShare()}
      />
      <ScrollView scrollY className="info-detail-page__scroll">
        <View className="secondary-card info-detail__head">
          <Text className="info-detail__title">{detail.title}</Text>
          {detail.publishTime && (
            <Text className="info-detail__time">发布时间：{formatDate(detail.publishTime)}</Text>
          )}
          <View className="info-detail__head-actions">
            {detail.originUrl && (
              <AtButton type="primary" full onClick={handleViewOriginal} className="info-detail__head-action">
                查看原文
              </AtButton>
            )}
            {!detail.originUrl && detail.sourceSiteName && (
              <Text className="info-detail__head-source">来源：{detail.sourceSiteName}</Text>
            )}
          </View>
        </View>
        {detail.description && (
          <View className="secondary-card info-detail__summary">{detail.description}</View>
        )}
        <View className="secondary-card info-detail__body">
          <Text className="info-detail__body-label">正文内容</Text>
          {detail.content ? (
            <RichText className="info-detail__content" nodes={detail.content} />
          ) : (
            <Text className="info-detail__empty">暂无正文内容</Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
