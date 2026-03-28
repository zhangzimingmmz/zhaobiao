import { useState, useEffect } from 'react'
import { View, Text, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import { useProtectedPage } from '../../hooks/useProtectedPage'
import './index.scss'

function normalizeAttachments(detailData) {
  if (!Array.isArray(detailData?.attachments)) return []
  return detailData.attachments
    .map((item) => ({
      name: item?.name || '附件',
      url: item?.url || '',
    }))
    .filter((item) => !!item.url)
}

function inferFileType(attachment) {
  const source = `${attachment?.name || ''} ${attachment?.url || ''}`.toLowerCase()
  if (source.includes('.pdf')) return 'pdf'
  if (source.includes('.docx')) return 'docx'
  if (source.includes('.doc')) return 'doc'
  if (source.includes('.xlsx')) return 'xlsx'
  if (source.includes('.xls')) return 'xls'
  if (source.includes('.pptx')) return 'pptx'
  if (source.includes('.ppt')) return 'ppt'
  return undefined
}

export default function Detail() {
  const isAuthorized = useProtectedPage('请先登录后查看详情')
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const id = Taro.getCurrentInstance().router?.params?.id || ''

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false)
      setDetail(null)
      return
    }

    if (!id) {
      setLoading(false)
      return
    }
    api.detailBid(id)
      .then((res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          const nextDetail = {
            ...res.data.data,
            attachments: normalizeAttachments(res.data.data),
          }
          setDetail(nextDetail)
          setFavorited(!!nextDetail.favorited)
        }
      })
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [id, isAuthorized])

  const handleViewOriginal = () => {
    if (detail && detail.originUrl) {
      Taro.setClipboardData({
        data: detail.originUrl,
        success: () => Taro.showToast({ title: '原文链接已复制，请在浏览器中打开', icon: 'none' }),
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

  const handleDownloadAttachment = (attachment) => {
    if (!attachment?.url) return
    const fileType = inferFileType(attachment)

    Taro.showLoading({ title: '下载中...', mask: true })
    Taro.downloadFile({
      url: attachment.url,
      success: (res) => {
        if (res.statusCode !== 200 || !res.tempFilePath) {
          Taro.showToast({ title: '附件下载失败，请稍后重试', icon: 'none' })
          return
        }
        Taro.openDocument({
          filePath: res.tempFilePath,
          fileType,
          showMenu: true,
          fail: () => {
            Taro.showToast({ title: '附件已下载，但暂时无法打开', icon: 'none' })
          },
        })
      },
      fail: (err) => {
        const errMsg = String(err?.errMsg || '')
        if (errMsg.includes('domain list')) {
          Taro.showToast({ title: '附件域名未加入小程序下载白名单', icon: 'none' })
          return
        }
        Taro.showToast({ title: '附件下载失败，请稍后重试', icon: 'none' })
      },
      complete: () => {
        Taro.hideLoading()
      },
    })
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
  const attachments = Array.isArray(detail?.attachments) ? detail.attachments : []

  if (!isAuthorized) {
    return null
  }

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
        {attachments.length > 0 && (
          <View className="secondary-card detail-section">
            <Text className="detail-section__label">附件下载</Text>
            <View className="detail-section__attachments">
              {attachments.map((attachment, index) => (
                <View
                  key={`${attachment.url}-${index}`}
                  className="detail-section__attachment"
                  onClick={() => handleDownloadAttachment(attachment)}
                >
                  <Text className="detail-section__attachment-name">{attachment.name}</Text>
                  <Text className="detail-section__attachment-action">下载并打开</Text>
                </View>
              ))}
            </View>
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
