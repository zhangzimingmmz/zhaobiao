import { View, Text } from '@tarojs/components'
import AppIcon from '../AppIcon'
import './index.scss'

export default function BidCard({ item, onClick, onFavoriteToggle, favorited }) {
  const showMeta =
    item.categoryLabel || item.natureLabel || item.methodLabel || item.budgetLabel

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
              size={52}
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

      <View className="bid-card__facts">
        {item.purchaser && (
          <View className="bid-card__fact">
            <Text className="bid-card__fact-label">主体</Text>
            <Text className="bid-card__fact-value" numberOfLines={1}>{item.purchaser}</Text>
          </View>
        )}

        {item.sourceName && (
          <View className="bid-card__fact">
            <Text className="bid-card__fact-label">来源</Text>
            <Text className="bid-card__fact-value" numberOfLines={1}>{item.sourceName}</Text>
          </View>
        )}
      </View>

      <View className="bid-card__meta-list">
        {item.regionName && <Text className="bid-card__meta-line">地区：{item.regionName}</Text>}
        {item.deadlineLabel && <Text className="bid-card__meta-line">截止：{item.deadlineLabel}</Text>}
      </View>

      {item.publishLabel && (
        <View className="bid-card__footer">
          <Text className="bid-card__footer-text">发布：{item.publishLabel}</Text>
        </View>
      )}
    </View>
  )
}
