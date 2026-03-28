import { useMemo, useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import TopBar from '../../components/TopBar'
import SecondaryTabs from '../../components/SecondaryTabs'
import FilterBar from '../../components/FilterBar'
import InfoCard from '../../components/InfoCard'
import EmptyState from '../../components/EmptyState'
import BidCardSkeleton from '../../components/BidCardSkeleton'
import { api } from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import { normalizeArticleCoverUrl, openArticleOriginal } from '../../utils/articlePresentation'
import { useProtectedPage } from '../../hooks/useProtectedPage'
import './index.scss'

const SECONDARY_TABS = [
  { id: 'work_dynamics', label: '工作动态' },
  { id: 'policy', label: '政策法规' },
  { id: 'other', label: '其他' },
]

const CATEGORY_MAP = {
  work_dynamics: 'company_news',
  policy: 'policy',
  other: 'other',
}

const EMPTY_STATES = {
  work_dynamics: { title: '暂无工作动态', description: '当前分类下还没有可展示的内容，请稍后再试。' },
  policy: { title: '暂无政策法规', description: '当前分类下还没有可展示的内容，请稍后再试。' },
  other: { title: '暂无其他内容', description: '当前分类下还没有可展示的内容，请稍后再试。' },
}

const PLACEHOLDER_SUMMARIES = [
  '摘要 或者 作者需要说明的信息',
  '摘要或者作者需要说明的信息',
  '摘要',
  '作者需要说明的信息',
]

function isRelevantSummary(summary, title) {
  if (!summary || !summary.trim()) return false
  const s = summary.trim()
  const t = (title || '').trim()
  if (PLACEHOLDER_SUMMARIES.some((p) => s === p || s.includes(p))) return false
  if (t && (s === t || s.startsWith(t) || t.startsWith(s))) return false
  if (/测试.*vvv|vvv.*测试/.test(s)) return false
  return true
}

function normalizeInfoItem(item) {
  const publishTime = item.publishTime ?? item.publish_time ?? item.webdate ?? item.noticeTime ?? ''
  const rawSummary = item.summary || item.description || ''
  const summary = isRelevantSummary(rawSummary, item.title) ? rawSummary : ''
  return {
    ...item,
    id: item.id,
    site: item.site || undefined,
    title: item.title || '',
    summary,
    publishLabel: formatDate(publishTime),
    cover: normalizeArticleCoverUrl(item.coverImageUrl || item.cover || ''),
    wechatArticleUrl: item.wechatArticleUrl || '',
    originUrl: item.originUrl || item.wechatArticleUrl || '',
    categoryNum: item.category || '',
    viewType: 'info',
    favorited: !!item.favorited,
  }
}

const PAGE_SIZE = 10

export default function InformationPage() {
  const isAuthorized = useProtectedPage('请先登录后访问信息公开')
  const [secondary, setSecondary] = useState('work_dynamics')
  const [keyword, setKeyword] = useState('')

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(false)
  const [reloadVersion, setReloadVersion] = useState(0)

  const category = CATEGORY_MAP[secondary] || CATEGORY_MAP.work_dynamics
  const emptyState = EMPTY_STATES[secondary] || EMPTY_STATES.work_dynamics
  const isEnd = list.length >= total && total > 0

  const normalizedList = useMemo(() => list.map(normalizeInfoItem), [list])

  const hasActiveFilters = useMemo(() => Boolean(keyword), [keyword])

  useEffect(() => {
    if (!isAuthorized) {
      setLoading(false)
      setList([])
      setPage(1)
      setTotal(0)
      return
    }

    setLoading(true)
    setError(false)
    setList([])
    setPage(1)
    setTotal(0)

    api.getArticles({ page: 1, pageSize: PAGE_SIZE, category, keyword: keyword || undefined })
      .then((res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          setList(res.data.data.list || [])
          setTotal(res.data.data.total || 0)
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [category, isAuthorized, keyword, reloadVersion])

  useDidShow(() => {
    if (isAuthorized) {
      setReloadVersion((v) => v + 1)
    }
  })

  const handleLoadMore = () => {
    if (loadingMore || isEnd) return
    const nextPage = page + 1
    setLoadingMore(true)
    api.getArticles({ page: nextPage, pageSize: PAGE_SIZE, category, keyword: keyword || undefined })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          setList((prev) => [...prev, ...(res.data.data.list || [])])
          setTotal(res.data.data.total || 0)
          setPage(nextPage)
        } else {
          Taro.showToast({ title: '加载失败，请重试', icon: 'none' })
        }
      })
      .catch(() => Taro.showToast({ title: '加载失败，请重试', icon: 'none' }))
      .finally(() => setLoadingMore(false))
  }

  const handleSecondaryChange = (id) => { setSecondary(id); setKeyword('') }

  const handleFavoriteToggle = (item) => {
    if (!Taro.getStorageSync('token')) {
      Taro.showToast({ title: '请先登录后收藏', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    api.toggleFavorite({ targetId: item.id, targetType: 'info' })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          const nextFavorited = !!res.data.data.favorited
          setList((prev) => prev.map((r) => (r.id === item.id ? { ...r, favorited: nextFavorited } : r)))
          Taro.showToast({ title: nextFavorited ? '已加入收藏' : '已取消收藏', icon: 'none' })
        }
      })
  }

  const handleCardClick = (item) => {
    if (item.wechatArticleUrl || item.originUrl) {
      api.recordArticleView(item.id).catch(() => {})
      openArticleOriginal(item.wechatArticleUrl || item.originUrl)
      return
    }
    Taro.navigateTo({ url: `/pages/info-detail/index?id=${item.id}` })
  }

  const renderFooter = () => {
    if (loading || list.length === 0) return null
    if (isEnd) return <View className="channel-page__end"><Text className="text-caption">已全部加载</Text></View>
    return (
      <View className="channel-page__load-more" onClick={handleLoadMore}>
        {loadingMore ? <Text className="text-caption">加载中...</Text> : <Text className="text-primary">加载更多</Text>}
      </View>
    )
  }

  const renderListFeedback = () => {
    if (loading) return <><BidCardSkeleton variant="info" /><BidCardSkeleton variant="info" /></>
    if (error) return <EmptyState title="加载失败" description="请检查网络后重试" tone="error" />
    if (normalizedList.length === 0) {
      return (
        <EmptyState
          title={hasActiveFilters ? '暂无匹配结果' : emptyState.title}
          description={hasActiveFilters ? '可以清空关键词后再试' : emptyState.description}
        />
      )
    }
    return normalizedList.map((item) => (
      <InfoCard key={item.id} item={item} onClick={handleCardClick} onFavoriteToggle={handleFavoriteToggle} favorited={!!item.favorited} />
    ))
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <View className="page channel-page">
      <TopBar title="信息公开" variant="secondary" showBack />
      <View className="channel-page__body">
        <View className="channel-page__control-panel">
          <SecondaryTabs tabs={SECONDARY_TABS} value={secondary} onChange={handleSecondaryChange} />
          <FilterBar type="information" keyword={keyword} onKeywordChange={setKeyword} filterValues={{}} />
        </View>
        <View className="channel-page__list">
          {renderListFeedback()}
          {renderFooter()}
        </View>
      </View>
    </View>
  )
}
