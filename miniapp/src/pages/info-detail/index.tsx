import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { config } from '../../config'
import { api } from '../../services/api'
import { openArticleOriginal } from '../../utils/articlePresentation'
import { formatDate } from '../../utils/formatDate'
import './index.scss'

export default function InfoDetail() {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const id = Taro.getCurrentInstance().router?.params?.id || ''
  const probe = Taro.getCurrentInstance().router?.params?.probe || ''
  const probeTitle = decodeURIComponent(Taro.getCurrentInstance().router?.params?.title || '')
  const probeSummary = decodeURIComponent(Taro.getCurrentInstance().router?.params?.summary || '')
  const probeUrl = decodeURIComponent(Taro.getCurrentInstance().router?.params?.url || '')

  useEffect(() => {
    if (probe === '1') {
      setDetail({
        id: '__h5_probe__',
        title: probeTitle || 'H5 探针测试消息',
        description: probeSummary || '用于验证个人主体小程序是否能通过 WebView 打开自有 H5 页面。',
        content: '<p>这是一条测试消息。请点击上方“查看原文”，验证小程序是否能够打开自有 H5 探针页。</p>',
        publishTime: new Date().toISOString(),
        originUrl: probeUrl || `${config.baseUrl}/h5-probe.html`,
        sourceSiteName: 'Probe',
        isProbe: true,
      })
      setFavorited(false)
      setLoading(false)
      return
    }
    if (!id) {
      setLoading(false)
      return
    }
    const applyDetail = (data) => {
      setDetail(data)
      setFavorited(!!data.favorited)
    }
    api.getArticle(id)
      .then((res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          const d = res.data.data
          applyDetail({
            id: d.id,
            title: d.title,
            description: d.summary,
            content: null,
            publishTime: d.publishTime,
            originUrl: d.wechatArticleUrl || null,
            sourceSiteName: null,
          })
          api.recordArticleView(d.id).catch(() => {})
          return true
        }
        return false
      })
      .catch(() => false)
      .then((isArticle) => {
        if (isArticle) return
        return api.detailInfo(id).then((res) => {
          if (res.data && res.data.code === 200 && res.data.data) {
            applyDetail(res.data.data)
          } else {
            setDetail(null)
          }
        })
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [id])

  const handleViewOriginal = () => {
    if (!detail || !detail.originUrl) return
    openArticleOriginal(detail.originUrl)
  }

  const handleShare = () => {
    if (!detail) return

    const sharePayload = detail.originUrl || detail.title
    Taro.setClipboardData({ data: sharePayload })
    Taro.showToast({ title: detail.originUrl ? '原文链接已复制' : '标题已复制', icon: 'none' })
  }

  const handleFavoriteToggle = () => {
    if (!detail) return
    if (detail.isProbe) return
    if (!Taro.getStorageSync('token')) {
      Taro.showToast({ title: '请先登录后收藏', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    api.toggleFavorite({
      targetId: detail.id,
      targetType: 'info',
      targetSite: detail.site || undefined,
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
        right={detail.isProbe ? undefined : favorited ? 'favorite-active' : 'favorite'}
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
