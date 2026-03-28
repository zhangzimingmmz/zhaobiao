import { View, Text } from '@tarojs/components'
import './index.scss'

export default function BidPreviewCard({ item, onClick }) {
  return (
    <View className="bid-preview-card" onClick={() => onClick?.(item)}>
      <Text className="bid-preview-card__title" numberOfLines={1}>{item.title}</Text>

      <View className="bid-preview-card__meta-row">
        <View className="bid-preview-card__meta-main">
          {item.categoryLabel ? (
            <Text className="bid-preview-card__tag">{item.categoryLabel}</Text>
          ) : null}

          {item.sourceName ? (
            <View className="bid-preview-card__fact">
              <Text className="bid-preview-card__fact-label">来源</Text>
              <Text className="bid-preview-card__fact-value" numberOfLines={1}>{item.sourceName}</Text>
            </View>
          ) : null}
        </View>

        {item.publishLabel ? (
          <Text className="bid-preview-card__date">{item.publishLabel}</Text>
        ) : null}
      </View>
    </View>
  )
}
