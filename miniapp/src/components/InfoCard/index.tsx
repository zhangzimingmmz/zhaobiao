import { View, Text, Image } from '@tarojs/components'
import AppIcon from '../AppIcon'
import './index.scss'

export default function InfoCard({ item, onClick }) {
  return (
    <View className="info-card" onClick={() => onClick && onClick(item)}>
      <View className="info-card__body">
        <View className="info-card__content">
          <Text className="info-card__title" numberOfLines={2}>{item.title}</Text>
          {item.summary ? (
            <Text className="info-card__summary" numberOfLines={2}>{item.summary}</Text>
          ) : null}
          <View className="info-card__time">
            <AppIcon name="clock" size={22} color="#86909C" />
            <Text>{item.publishLabel || ''}</Text>
          </View>
        </View>
        {item.cover && (
          <Image className="info-card__cover" src={item.cover} mode="aspectFill" />
        )}
      </View>
    </View>
  )
}
