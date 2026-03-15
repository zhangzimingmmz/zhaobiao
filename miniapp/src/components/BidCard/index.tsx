import { View, Text } from '@tarojs/components'
import './index.scss'

export default function BidCard({ item, onClick }) {
  const showMeta =
    item.categoryLabel || item.natureLabel || item.methodLabel || item.budgetLabel

  return (
    <View className="bid-card" onClick={() => onClick && onClick(item)}>
      <Text className="bid-card__title" numberOfLines={2}>{item.title}</Text>

      {showMeta && (
        <View className="bid-card__meta">
          {item.categoryLabel && <Text className="bid-card__tag bid-card__tag--category">{item.categoryLabel}</Text>}
          {item.natureLabel && <Text className="bid-card__tag bid-card__tag--nature">{item.natureLabel}</Text>}
          {item.methodLabel && <Text className="bid-card__tag bid-card__tag--method">{item.methodLabel}</Text>}
          {item.budgetLabel && <Text className="bid-card__tag bid-card__tag--budget">{item.budgetLabel}</Text>}
        </View>
      )}

      {item.purchaser && (
        <Text className="bid-card__line" numberOfLines={1}>{item.purchaser}</Text>
      )}

      {!item.purchaser && item.sourceName && (
        <Text className="bid-card__line" numberOfLines={1}>来源：{item.sourceName}</Text>
      )}

      <View className="bid-card__meta-list">
        {item.regionName && <Text className="bid-card__meta-line">{item.regionName}</Text>}
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
