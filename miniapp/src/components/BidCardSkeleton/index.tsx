import { View } from '@tarojs/components'
import './index.scss'

export default function BidCardSkeleton({ variant = 'bid' }) {
  if (variant === 'info') {
    return (
      <View className="bid-card-skeleton bid-card-skeleton--info">
        <View className="bid-card-skeleton__title" />
        <View className="bid-card-skeleton__title bid-card-skeleton__title--short" />
        <View className="bid-card-skeleton__line bid-card-skeleton__line--long" />
        <View className="bid-card-skeleton__meta">
          <View className="bid-card-skeleton__meta-item bid-card-skeleton__meta-item--time" />
        </View>
      </View>
    )
  }

  return (
    <View className="bid-card-skeleton">
      <View className="bid-card-skeleton__title" />
      <View className="bid-card-skeleton__title bid-card-skeleton__title--short" />
      <View className="bid-card-skeleton__chips">
        <View className="bid-card-skeleton__chip" />
        <View className="bid-card-skeleton__chip bid-card-skeleton__chip--wide" />
      </View>
      <View className="bid-card-skeleton__line" />
      <View className="bid-card-skeleton__meta">
        <View className="bid-card-skeleton__meta-item" />
        <View className="bid-card-skeleton__meta-item" />
      </View>
    </View>
  )
}
