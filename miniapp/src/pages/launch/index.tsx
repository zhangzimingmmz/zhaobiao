import { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import cityNightImage from '../../assets/images/city-night.jpg'
import { hasAuthToken, HOME_PAGE_URL, LOGIN_PAGE_URL } from '../../utils/auth'
import './index.scss'

const LAUNCH_DURATION = 2000

export default function Launch() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(100, (elapsed / LAUNCH_DURATION) * 100)
      setProgress(newProgress)
      
      if (elapsed >= LAUNCH_DURATION) {
        clearInterval(timer)
        if (hasAuthToken()) {
          Taro.switchTab({ url: HOME_PAGE_URL })
          return
        }

        Taro.redirectTo({ url: LOGIN_PAGE_URL })
      }
    }, 50)

    return () => clearInterval(timer)
  }, [])

  return (
    <View className="launch-page">
      <Image
        className="launch-page__background"
        src={cityNightImage}
        mode="aspectFill"
      />
      <View className="launch-page__overlay" />
      <View className="launch-page__overlay launch-page__overlay--vignette" />
      <View className="launch-page__content">
        <Text className="launch-page__title">金堂招讯通</Text>
        <Text className="launch-page__subtitle">信息决策 助推企业拓八方</Text>
      </View>
      <View className="launch-page__footer">
        <Text className="launch-page__loading-text">正在加载招采资讯...</Text>
        <View className="launch-page__progress-bar">
          <View 
            className="launch-page__progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    </View>
  )
}
