import { View, Text } from '@tarojs/components'
import AppIcon from '../AppIcon'
import './index.scss'

function toShortDate(value) {
  if (!value) return ''
  const matched = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (matched) {
    return `${matched[2]}-${matched[3]}`
  }
  return String(value)
}

export default function BidCard({ item, onClick, onFavoriteToggle, favorited }) {
  const showMeta =
    item.categoryLabel || item.natureLabel || item.methodLabel || item.budgetLabel
  const showSupportRow = item.sourceName || item.publishLabel
  const showSecondaryMeta = item.purchaser || item.regionName || item.deadlineLabel
  const shortPublishLabel = toShortDate(item.publishLabel)

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    onFavoriteToggle?.(item)
  }

  return (
    <View className="bid-card" onClick={() => onClick && onClick(item)}>
      <View className="bid-card__header">
        <Text className="bid-card__title" numberOfLines={2}>{item.title}</Text>
        {onFavoriteToggle && (
          <View className="bid-card__favorite" onClick={handleFavoriteClick}>
            <AppIcon
              name={favorited ? 'heartfill' : 'heart'}
              size={36}
              color={favorited ? '#ff4d4f' : '#c9cdd4'}
            />
          </View>
        )}
      </View>

      {showMeta && (
        <View className="bid-card__meta">
          {item.categoryLabel && <Text className="bid-card__tag bid-card__tag--category">{item.categoryLabel}</Text>}
          {item.natureLabel && <Text className="bid-card__tag bid-card__tag--nature">{item.natureLabel}</Text>}
          {item.methodLabel && <Text className="bid-card__tag bid-card__tag--method">{item.methodLabel}</Text>}
          {item.budgetLabel && <Text className="bid-card__tag bid-card__tag--budget">{item.budgetLabel}</Text>}
        </View>
      )}

      {showSupportRow && (
        <View className="bid-card__support">
          {item.sourceName && (
            <View className="bid-card__support-main">
              <Text className="bid-card__support-value" numberOfLines={1}>{item.sourceName}</Text>
            </View>
          )}
          {shortPublishLabel && <Text className="bid-card__support-date">{shortPublishLabel}</Text>}
        </View>
      )}

      {showSecondaryMeta && (
        <View className="bid-card__footer">
          <View className="bid-card__meta-list">
            {item.purchaser && <Text className="bid-card__meta-line" numberOfLines={1}>主体：{item.purchaser}</Text>}
            {item.regionName && <Text className="bid-card__meta-line" numberOfLines={1}>地区：{item.regionName}</Text>}
            {item.deadlineLabel && <Text className="bid-card__meta-line" numberOfLines={1}>截止：{item.deadlineLabel}</Text>}
          </View>
        </View>
      )}
    </View>
  )
}
