import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import './index.scss'

export default function InfoDetail() {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
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

  if (loading) {
    return (
      <View className="page page--secondary info-detail-page">
        <TopBar title="信息详情" showBack right="share" variant="secondary" />
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
      <TopBar title="信息详情" showBack right="share" variant="secondary" onRight={handleShare} />
      <ScrollView scrollY className="info-detail-page__scroll">
        <View className="secondary-card info-detail__head">
          <Text className="info-detail__title">{detail.title}</Text>
          {detail.publishTime && (
            <Text className="info-detail__time">发布时间：{detail.publishTime}</Text>
          )}
          <View className="info-detail__head-actions">
            {detail.originUrl && (
              <View className="btn-wechat info-detail__head-action" onClick={handleViewOriginal}>
                查看原文
              </View>
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
