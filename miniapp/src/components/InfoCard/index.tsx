import { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import AppIcon from '../AppIcon'
import './index.scss'

export default function InfoCard({ item, onClick, onFavoriteToggle, favorited }) {
  const [mediaFailed, setMediaFailed] = useState(false)
  const hasCover = !!item.cover && !mediaFailed

  useEffect(() => {
    setMediaFailed(false)
  }, [item.id, item.cover])

  const handleFavoriteClick = (e) => {
    e.stopPropagation()
    onFavoriteToggle?.(item)
  }

  return (
    <View
      className={`info-card ${hasCover ? 'info-card--with-cover' : 'info-card--text-only'}`}
      onClick={() => onClick && onClick(item)}
    >
      <View className="info-card__body">
        {hasCover && (
          <Image
            className="info-card__cover"
            src={item.cover}
            mode="aspectFill"
            onError={() => setMediaFailed(true)}
          />
        )}
        <View className="info-card__content">
          <View className="info-card__header">
            <Text className="info-card__title" numberOfLines={2}>{item.title}</Text>
            {onFavoriteToggle && (
              <View className="info-card__favorite" onClick={handleFavoriteClick}>
                <AppIcon
                  name={favorited ? 'heartfill' : 'heart'}
                  size={52}
                  color={favorited ? '#ff4d4f' : '#c9cdd4'}
                />
              </View>
            )}
          </View>
          {item.categoryNum ? (
            <View className="info-card__badge-row">
              <Text className="info-card__badge">{item.categoryNum === 'probe' ? '测试入口' : '资讯内容'}</Text>
            </View>
          ) : null}
          {item.summary ? (
            <Text className="info-card__summary" numberOfLines={2}>{item.summary}</Text>
          ) : null}
          <View className="info-card__time">
            <AppIcon name="clock" size={22} color="#86909C" />
            <Text>{item.publishLabel || ''}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
