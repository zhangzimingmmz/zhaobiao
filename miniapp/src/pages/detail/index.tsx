import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { config } from '../../config'
import { api } from '../../services/api'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import './index.scss'

export default function Detail() {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const id = Taro.getCurrentInstance().router?.params?.id || ''

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    api.detailBid(id)
      .then((res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          setDetail(res.data.data)
          setFavorited(!!res.data.data.favorited)
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleViewOriginal = () => {
    if (detail && detail.originUrl) {
      const proxyUrl = `${config.baseUrl}/api/webview-proxy?url=${encodeURIComponent(detail.originUrl)}`
      Taro.navigateTo({
        url: '/pages/webview/index?url=' + encodeURIComponent(proxyUrl),
      })
    }
  }

  const handleFavoriteToggle = () => {
    if (!detail) return
    if (!Taro.getStorageSync('token')) {
      Taro.showToast({ title: '请先登录后收藏', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    api.toggleFavorite({
      targetId: detail.id,
      targetType: 'bid',
      targetSite: detail.site,
    })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          const nextFavorited = !!res.data.data.favorited
          setFavorited(nextFavorited)
          Taro.showToast({ title: nextFavorited ? '已加入收藏' : '已取消收藏', icon: 'none' })
          return
        }
        Taro.showToast({ title: res.data?.message || '操作失败，请重试', icon: 'none' })
      })
      .catch(() => Taro.showToast({ title: '操作失败，请重试', icon: 'none' }))
  }

  const dateTimeFields = ['报名开始', '报名截止', '开标时间']
  const structuredRows = detail
    ? [
        ['预算金额', detail.budget],
        ['地点', detail.location],
        ['招标人/采购人', detail.tenderer],
        ['代理机构', detail.agency],
        ['报名开始', detail.enrollStart],
        ['报名截止', detail.enrollEnd],
        ['开标时间', detail.openTime],
      ]
      .filter(([, value]) => !!value)
      .map(([label, value]) => [
        label,
        dateTimeFields.includes(label) ? formatDateTime(value) : value,
      ])
    : []

  if (loading) {
    return (
      <View className="page page--secondary detail-page">
        <TopBar title="招投标详情" showBack right="favorite" variant="secondary" />
        <View className="detail-page__loading"><Text>加载中...</Text></View>
      </View>
    )
  }
  if (!detail) {
    return (
      <View className="page page--secondary detail-page">
        <TopBar title="招投标详情" showBack variant="secondary" />
        <View className="detail-page__empty"><Text>暂无详情</Text></View>
      </View>
    )
  }

  return (
    <View className="page page--secondary detail-page">
      <TopBar
        title="招投标详情"
        showBack
        right={favorited ? 'favorite-active' : 'favorite'}
        variant="secondary"
        onRight={handleFavoriteToggle}
      />
      <ScrollView scrollY className="detail-page__scroll">
        <View className="secondary-card detail-card">
          {detail.categoryName && <Text className="detail-card__tag">{detail.categoryName}</Text>}
          <Text className="detail-card__title">{detail.title}</Text>
          {detail.publishTime && (
            <Text className="detail-card__time">发布时间：{formatDate(detail.publishTime)}</Text>
          )}
          <View className="detail-card__actions">
            {detail.originUrl && (
              <AtButton type="primary" full onClick={handleViewOriginal} className="detail-card__action">
                查看原文
              </AtButton>
            )}
            {!detail.originUrl && detail.sourceSiteName && (
              <Text className="detail-card__source">来源：{detail.sourceSiteName}</Text>
            )}
          </View>
        </View>
        {structuredRows.length > 0 && (
          <View className="secondary-card detail-section">
            <Text className="detail-section__label">关键信息</Text>
            {structuredRows.map(([label, value]) => (
              <View className="detail-section__item" key={label}>
                <Text className="detail-section__item-label">{label}</Text>
                <Text className="detail-section__item-value">{value}</Text>
              </View>
            ))}
          </View>
        )}
        <View className="secondary-card detail-section">
          <Text className="detail-section__label">公告正文</Text>
          {detail.content ? (
            <RichText className="detail-section__content" nodes={detail.content} />
          ) : (
            <Text className="detail-section__empty">暂无正文内容</Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}
