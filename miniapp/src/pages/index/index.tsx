import { useMemo, useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TopBar from '../../components/TopBar'
import PrimaryTabs from '../../components/PrimaryTabs'
import SecondaryTabs from '../../components/SecondaryTabs'
import FilterBar from '../../components/FilterBar'
import FilterSheet from '../../components/FilterSheet'
import BidCard from '../../components/BidCard'
import InfoCard from '../../components/InfoCard'
import EmptyState from '../../components/EmptyState'
import BidCardSkeleton from '../../components/BidCardSkeleton'
import { api } from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import {
  inferFavoritesType,
  isFavoriteRecord,
  saveFavoriteRecord,
  removeFavoriteRecord,
} from '../../utils/favorites'
import './index.scss'

const NATURE_LABELS = {
  '1': '货物',
  '2': '工程',
  '3': '服务',
}

const METHOD_LABELS = {
  '1': '公开招标',
  '2': '邀请招标',
  '3': '竞争性谈判',
  '4': '询价',
  '5': '单一来源',
  '6': '竞争性磋商',
}

const SECONDARY_MAP = {
  construction: [
    { id: 'engineering', label: '工程建设' },
    { id: 'procurement', label: '政府采购' },
  ],
  government: [
    { id: 'intention', label: '采购意向公开' },
    { id: 'announcement', label: '采购公告' },
  ],
  info: [
    { id: 'work_dynamics', label: '工作动态' },
    { id: 'policy', label: '政策法规' },
    { id: 'other', label: '其他' },
  ],
}

const HOME_STATES = {
  'construction:engineering': {
    id: 'engineering-engineering',
    listKind: 'bid',
    emptyTitle: '暂无工程建设数据',
    emptyDescription: '可以切换招标计划、发布时间或交易来源后再试。',
  },
  'construction:procurement': {
    id: 'engineering-procurement',
    listKind: 'bid',
    emptyTitle: '暂无政府采购公告',
    emptyDescription: '可以调整发布时间或交易来源后再试。',
  },
  'government:intention': {
    id: 'procurement-intention',
    listKind: 'bid',
    emptyTitle: '暂无采购意向公开',
    emptyDescription: '可以切换区划或调整发布时间后再试。',
  },
  'government:announcement': {
    id: 'procurement-announcement',
    listKind: 'bid',
    emptyTitle: '暂无采购公告',
    emptyDescription: '可以调整采购性质、采购方式或区划后再试。',
  },
  'info:work_dynamics': {
    id: 'information',
    listKind: 'info',
    emptyTitle: '暂无工作动态',
    emptyDescription: '当前分类下还没有可展示的内容，请稍后再试。',
  },
  'info:policy': {
    id: 'information',
    listKind: 'info',
    emptyTitle: '暂无政策法规',
    emptyDescription: '当前分类下还没有可展示的内容，请稍后再试。',
  },
  'info:other': {
    id: 'information',
    listKind: 'info',
    emptyTitle: '暂无其他内容',
    emptyDescription: '当前分类下还没有可展示的内容，请稍后再试。',
  },
}

function getHomeState(primary, secondary) {
  if (primary === 'info') return HOME_STATES[`info:${secondary}`] || HOME_STATES['info:work_dynamics']
  return HOME_STATES[`${primary}:${secondary}`] || HOME_STATES['construction:engineering']
}

function getCategory(primary, secondary, announcementType) {
  if (primary === 'construction' && secondary === 'engineering') {
    return announcementType === 'plan' ? '002001009' : '002001001'
  }
  if (primary === 'construction' && secondary === 'procurement') return '002002001'
  if (primary === 'government' && secondary === 'intention') return '59'
  if (primary === 'government' && secondary === 'announcement') return '00101'
  if (primary === 'info') {
    const infoCategoryMap = { work_dynamics: 'company_news', policy: 'policy', other: 'other' }
    return infoCategoryMap[secondary] || 'company_news'
  }
  return 'info'
}

/** 将时间筛选值转换为 { timeStart, timeEnd } */
function parseTimeFilter(value) {
  if (!value) return {}
  if (value.includes('|')) {
    const [start, end] = value.split('|')
    return {
      timeStart: start ? `${start} 00:00:00` : undefined,
      timeEnd: end ? `${end} 23:59:59` : undefined,
    }
  }
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (value === 'today') {
    const today = fmt(now)
    return { timeStart: `${today} 00:00:00`, timeEnd: `${today} 23:59:59` }
  }
  if (value === '3d') {
    const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
    return { timeStart: `${fmt(past)} 00:00:00`, timeEnd: `${fmt(now)} 23:59:59` }
  }
  if (value === '7d') {
    const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)
    return { timeStart: `${fmt(past)} 00:00:00`, timeEnd: `${fmt(now)} 23:59:59` }
  }
  if (value === '30d') {
    const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000)
    return { timeStart: `${fmt(past)} 00:00:00`, timeEnd: `${fmt(now)} 23:59:59` }
  }
  return {}
}

const PAGE_SIZE = 10

function formatBudget(value) {
  if (!value) return ''
  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)
  return `${(amount / 10000).toFixed(2)}万元`
}

function normalizeBidItem(item) {
  return {
    id: item.id,
    title: item.title || '',
    categoryNum: item.categoryNum || '',
    categoryLabel: item.categoryName || '',
    natureLabel: item.purchaseNature ? NATURE_LABELS[item.purchaseNature] || '' : '',
    methodLabel: item.purchaseManner ? METHOD_LABELS[item.purchaseManner] || '' : '',
    budgetLabel: formatBudget(item.budget),
    purchaser: item.purchaser || item.tenderer || '',
    regionName: item.regionName || item.location || '',
    sourceName: item.sourceName || item.zhuanzai || item.author || '',
    deadlineLabel: formatDate(item.expireTime || item.openTenderTime || item.enrollEnd || ''),
    publishLabel: formatDate(item.publishTime || item.webdate || item.noticeTime || ''),
  }
}

/** 常见占位符或无效摘要，不展示 */
const PLACEHOLDER_SUMMARIES = [
  '摘要 或者 作者需要说明的信息',
  '摘要或者作者需要说明的信息',
  '摘要',
  '作者需要说明的信息',
]

/** 判断摘要是否值得展示，过滤占位符、重复标题、明显测试内容 */
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
  const publishTime =
    item.publishTime ?? item.publish_time ?? item.webdate ?? item.noticeTime ?? ''
  const rawSummary = item.summary || item.description || ''
  const summary = isRelevantSummary(rawSummary, item.title) ? rawSummary : ''
  return {
    id: item.id,
    title: item.title || '',
    summary,
    publishLabel: formatDate(publishTime),
    cover: item.coverImageUrl || item.cover || '',
    wechatArticleUrl: item.wechatArticleUrl || '',
    categoryNum: item.category || '',
    viewType: 'info',
  }
}

export default function Index() {
  const [primary, setPrimary] = useState('construction')
  const [secondary, setSecondary] = useState('engineering')
  const [announcementType, setAnnouncementType] = useState('announcement')
  const [filterSheetVisible, setFilterSheetVisible] = useState(false)
  const [filterKey, setFilterKey] = useState('')
  const [keyword, setKeyword] = useState('')
  const [filterValues, setFilterValues] = useState({})

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(false)
  const [favoritesVersion, setFavoritesVersion] = useState(0)

  const secondaryTabs = SECONDARY_MAP[primary] || []
  const homeState = useMemo(() => getHomeState(primary, secondary), [primary, secondary])
  const category = useMemo(() => getCategory(primary, secondary, announcementType), [primary, secondary, announcementType])
  const isEnd = list.length >= total && total > 0
  const isInfoState = homeState.listKind === 'info'
  const normalizedList = useMemo(
    () => list.map((item) => (isInfoState ? normalizeInfoItem(item) : normalizeBidItem(item))),
    [list, isInfoState],
  )
  const hasActiveFilters = useMemo(() => {
    return Boolean(
      keyword ||
      Object.values(filterValues).some((value) => value && value.code),
    )
  }, [keyword, filterValues])

  /** 构建传给 api.list 的参数 */
  const buildParams = useCallback((pageNum) => {
    const timeFilter = parseTimeFilter(filterValues.time?.code || '')
    return {
      page: pageNum,
      pageSize: PAGE_SIZE,
      category,
      keyword: keyword || undefined,
      regionCode: filterValues.region?.code || undefined,
      source: filterValues.source?.code || undefined,
      purchaseManner: filterValues.method?.code || undefined,
      purchaseNature: filterValues.nature?.code || undefined,
      purchaser: filterValues.purchaser?.code || undefined,
      ...timeFilter,
    }
  }, [category, keyword, filterValues])

  /** 加载第一页（切换 tab/筛选时调用） */
  useEffect(() => {
    setLoading(true)
    setError(false)
    setList([])
    setPage(1)
    setTotal(0)
    
    // 信息展示 tab 使用文章接口
    if (primary === 'info') {
      api.getArticles({ page: 1, pageSize: PAGE_SIZE, category })
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
    } else {
      api.list(buildParams(1))
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
    }
  }, [category, keyword, filterValues, primary, secondary])

  /** 加载更多 */
  const handleLoadMore = () => {
    if (loadingMore || isEnd) return
    const nextPage = page + 1
    setLoadingMore(true)
    
    // 信息展示 tab 使用文章接口
    if (primary === 'info') {
      api.getArticles({ page: nextPage, pageSize: PAGE_SIZE, category })
        .then((res) => {
          if (res.data && res.data.code === 200 && res.data.data) {
            setList((prev) => [...prev, ...(res.data.data.list || [])])
            setTotal(res.data.data.total || 0)
            setPage(nextPage)
          } else {
            Taro.showToast({ title: '加载失败，请重试', icon: 'none' })
          }
        })
        .catch(() => Taro.showToast({ title: '加载失败，请重试', icon: 'none' }))
        .finally(() => setLoadingMore(false))
    } else {
      api.list(buildParams(nextPage))
        .then((res) => {
          if (res.data && res.data.code === 200 && res.data.data) {
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
  }

  const handlePrimaryChange = (id) => {
    setPrimary(id)
    const sec = SECONDARY_MAP[id]
    setSecondary(sec && sec[0] ? sec[0].id : '')
    if (id === 'construction') setAnnouncementType('announcement')
    setFilterValues({})
  }

  const handleSecondaryChange = (id) => {
    setSecondary(id)
    setFilterValues({})
  }

  const handleFilterClick = (key) => {
    setFilterKey(key)
    setFilterSheetVisible(true)
  }

  const handleFilterApply = (key, code, label) => {
    setFilterValues((prev) => ({
      ...prev,
      [key]: { code, label: label || code },
    }))
  }

  const handleFavoriteToggle = (item) => {
    const favorited = isFavoriteRecord(item, item.viewType || 'bid')
    if (favorited) {
      removeFavoriteRecord(item, item.viewType || 'bid')
      Taro.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      const favoritesType =
        item.viewType === 'info'
          ? 'info'
          : item.categoryNum
            ? inferFavoritesType(item)
            : item.planId || /采购/.test(item.categoryLabel || item.title || '')
              ? 'government'
              : 'construction'
      saveFavoriteRecord(item, {
        viewType: item.viewType || 'bid',
        favoritesType,
      })
      Taro.showToast({ title: '已加入收藏', icon: 'none' })
    }
    setFavoritesVersion((v) => v + 1)
  }

  const handleCardClick = (item) => {
    if (isInfoState) {
      // 统一进入详情页，在详情页再点击「查看原文」；避免直接打开失败时无兜底
      Taro.navigateTo({ url: `/pages/info-detail/index?id=${item.id}` })
    } else {
      Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` })
    }
  }

  // FilterBar 需要的 filterValues 展示格式（只传 label）
  const filterLabels = useMemo(() => {
    const result = {}
    Object.entries(filterValues).forEach(([k, v]) => {
      result[k] = v.label
    })
    return result
  }, [filterValues])

  const renderFooter = () => {
    if (loading || list.length === 0) return null
    if (isEnd) return <View className="index-page__end"><Text className="text-caption">已全部加载</Text></View>
    return (
      <View className="index-page__load-more" onClick={handleLoadMore}>
        {loadingMore
          ? <Text className="text-caption">加载中...</Text>
          : <Text className="text-primary">加载更多</Text>}
      </View>
    )
  }

  const renderListFeedback = () => {
    if (loading) {
      return (
        <>
          <BidCardSkeleton variant={homeState.listKind} />
          <BidCardSkeleton variant={homeState.listKind} />
          <BidCardSkeleton variant={homeState.listKind} />
        </>
      )
    }

    if (error) {
      return (
        <EmptyState
          title="加载失败"
          description={`${homeState.emptyDescription} 请检查网络或服务状态后重试。`}
          tone="error"
        />
      )
    }

    if (normalizedList.length === 0) {
      return (
        <EmptyState
          title={hasActiveFilters ? '暂无匹配结果' : homeState.emptyTitle}
          description={
            hasActiveFilters
              ? '当前筛选条件下没有匹配结果，可以清空关键词或调整筛选后再试。'
              : homeState.emptyDescription
          }
        />
      )
    }

    if (isInfoState) {
      return normalizedList.map((item) => (
        <InfoCard
          key={item.id}
          item={item}
          onClick={handleCardClick}
          onFavoriteToggle={handleFavoriteToggle}
          favorited={isFavoriteRecord(item, item.viewType || 'info')}
        />
      ))
    }

    return normalizedList.map((item) => (
      <BidCard
        key={item.id}
        item={item}
        onClick={handleCardClick}
        onFavoriteToggle={handleFavoriteToggle}
        favorited={isFavoriteRecord(item, 'bid')}
      />
    ))
  }

  return (
    <View className="page page--tab index-page">
      <TopBar title="金堂招讯通" variant="tab" />
      <PrimaryTabs value={primary} onChange={handlePrimaryChange} />
      {secondaryTabs.length > 0 && (
        <SecondaryTabs
          tabs={secondaryTabs}
          value={secondary}
          onChange={handleSecondaryChange}
        />
      )}
      <FilterBar
        type={homeState.id}
        keyword={keyword}
        onKeywordChange={setKeyword}
        onFilterClick={handleFilterClick}
        filterValues={filterLabels}
        announcementType={announcementType}
        onAnnouncementTypeChange={setAnnouncementType}
      />
      <View className="index-page__list">
        {renderListFeedback()}
        {renderFooter()}
      </View>
      <FilterSheet
        visible={filterSheetVisible}
        type={filterKey}
        selectedValue={filterValues[filterKey]?.code || ''}
        onApply={handleFilterApply}
        onClose={() => setFilterSheetVisible(false)}
      />
    </View>
  )
}
