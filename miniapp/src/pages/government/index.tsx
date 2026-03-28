import { useMemo, useState, useEffect, useCallback } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import TopBar from '../../components/TopBar'
import SecondaryTabs from '../../components/SecondaryTabs'
import FilterBar from '../../components/FilterBar'
import FilterSheet from '../../components/FilterSheet'
import BidCard from '../../components/BidCard'
import EmptyState from '../../components/EmptyState'
import BidCardSkeleton from '../../components/BidCardSkeleton'
import { api } from '../../services/api'
import { formatDate } from '../../utils/formatDate'
import { useProtectedPage } from '../../hooks/useProtectedPage'
import './index.scss'

const SECONDARY_TABS = [
  { id: 'intention', label: '采购意向公开' },
  { id: 'announcement', label: '采购公告' },
]

const CATEGORY_MAP = {
  intention: '59',
  announcement: '00101',
}

const FILTER_MODES = {
  intention: 'procurement-intention',
  announcement: 'procurement-announcement',
}

const EMPTY_STATES = {
  intention: { title: '暂无采购意向公开', description: '可以切换区划或调整发布时间后再试。' },
  announcement: { title: '暂无采购公告', description: '可以调整项目分类、采购方式或区划后再试。' },
}

const NATURE_LABELS = { '1': '货物', '2': '工程', '3': '服务' }
const METHOD_LABELS = { '1': '公开招标', '2': '邀请招标', '3': '竞争性谈判', '4': '询价', '5': '单一来源', '6': '竞争性磋商' }

function formatBudget(value) {
  if (!value) return ''
  const amount = Number(value)
  if (Number.isNaN(amount)) return String(value)
  return `${(amount / 10000).toFixed(2)}万元`
}

function normalizeBidItem(item) {
  return {
    ...item,
    id: item.id,
    site: item.site,
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
    favorited: !!item.favorited,
  }
}

function parseTimeFilter(value) {
  if (!value) return {}
  if (value.includes('|')) {
    const [start, end] = value.split('|')
    return { timeStart: start ? `${start} 00:00:00` : undefined, timeEnd: end ? `${end} 23:59:59` : undefined }
  }
  const now = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  if (value === 'today') return { timeStart: `${fmt(now)} 00:00:00`, timeEnd: `${fmt(now)} 23:59:59` }
  if (value === '3d') { const past = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); return { timeStart: `${fmt(past)} 00:00:00`, timeEnd: `${fmt(now)} 23:59:59` } }
  if (value === '7d') { const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000); return { timeStart: `${fmt(past)} 00:00:00`, timeEnd: `${fmt(now)} 23:59:59` } }
  if (value === '30d') { const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000); return { timeStart: `${fmt(past)} 00:00:00`, timeEnd: `${fmt(now)} 23:59:59` } }
  return {}
}

const PAGE_SIZE = 10

export default function GovernmentPage() {
  const isAuthorized = useProtectedPage('请先登录后访问政府采购')
  const [secondary, setSecondary] = useState('intention')
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
  const [reloadVersion, setReloadVersion] = useState(0)

  const category = CATEGORY_MAP[secondary] || CATEGORY_MAP.intention
  const filterType = FILTER_MODES[secondary] || FILTER_MODES.intention
  const emptyState = EMPTY_STATES[secondary] || EMPTY_STATES.intention
  const isEnd = list.length >= total && total > 0

  const normalizedList = useMemo(() => list.map(normalizeBidItem), [list])

  const hasActiveFilters = useMemo(() => Boolean(keyword || Object.values(filterValues).some((v) => v && v.code)), [keyword, filterValues])

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
  }, [buildParams, isAuthorized, reloadVersion])

  useDidShow(() => {
    if (isAuthorized) {
      setReloadVersion((v) => v + 1)
    }
  })

  const handleLoadMore = () => {
    if (loadingMore || isEnd) return
    const nextPage = page + 1
    setLoadingMore(true)
    api.list(buildParams(nextPage))
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

  const handleSecondaryChange = (id) => { setSecondary(id); setKeyword(''); setFilterValues({}) }
  const handleFilterClick = (key) => { setFilterKey(key); setFilterSheetVisible(true) }
  const handleFilterApply = (key, code, label) => { setFilterValues((prev) => ({ ...prev, [key]: { code, label: label || code } })) }

  const handleFavoriteToggle = (item) => {
    if (!Taro.getStorageSync('token')) {
      Taro.showToast({ title: '请先登录后收藏', icon: 'none' })
      Taro.navigateTo({ url: '/pages/login/index' })
      return
    }
    api.toggleFavorite({ targetId: item.id, targetType: 'bid', targetSite: item.site })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          const nextFavorited = !!res.data.data.favorited
          setList((prev) => prev.map((r) => (r.id === item.id && (r.site || '') === (item.site || '') ? { ...r, favorited: nextFavorited } : r)))
          Taro.showToast({ title: nextFavorited ? '已加入收藏' : '已取消收藏', icon: 'none' })
        }
      })
  }

  const handleCardClick = (item) => { Taro.navigateTo({ url: `/pages/detail/index?id=${item.id}` }) }

  const filterLabels = useMemo(() => { const result = {}; Object.entries(filterValues).forEach(([k, v]) => { result[k] = v.label }); return result }, [filterValues])

  const renderFooter = () => {
    if (loading || list.length === 0) return null
    if (isEnd) return <View className="channel-page__end"><Text className="text-caption">已全部加载</Text></View>
    return <View className="channel-page__load-more" onClick={handleLoadMore}>{loadingMore ? <Text className="text-caption">加载中...</Text> : <Text className="text-primary">加载更多</Text>}</View>
  }

  const renderListFeedback = () => {
    if (loading) return <><BidCardSkeleton variant="bid" /><BidCardSkeleton variant="bid" /></>
    if (error) return <EmptyState title="加载失败" description="请检查网络后重试" tone="error" />
    if (normalizedList.length === 0) return <EmptyState title={hasActiveFilters ? '暂无匹配结果' : emptyState.title} description={hasActiveFilters ? '可以清空关键词或调整筛选后再试' : emptyState.description} />
    return normalizedList.map((item) => <BidCard key={item.id} item={item} onClick={handleCardClick} onFavoriteToggle={handleFavoriteToggle} favorited={!!item.favorited} />)
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <View className="page channel-page">
      <TopBar title="政府采购" variant="secondary" showBack />
      <View className="channel-page__body">
        <View className="channel-page__control-panel">
          <SecondaryTabs tabs={SECONDARY_TABS} value={secondary} onChange={handleSecondaryChange} />
          <FilterBar type={filterType} keyword={keyword} onKeywordChange={setKeyword} onFilterClick={handleFilterClick} filterValues={filterLabels} />
        </View>
        <View className="channel-page__list">{renderListFeedback()}{renderFooter()}</View>
      </View>
      <FilterSheet visible={filterSheetVisible} type={filterKey} selectedValue={filterValues[filterKey]?.code || ''} onApply={handleFilterApply} onClose={() => setFilterSheetVisible(false)} />
    </View>
  )
}
