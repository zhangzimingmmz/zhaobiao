import { Image, View } from '@tarojs/components'
import brandImage from '../../assets/images/company.jpg'

export default function AuthBrand(props) {
  const { variant = 'main' } = props

  return (
    <View className={`auth-page__brand auth-page__brand--${variant}`}>
      <View className="auth-page__brand-image-wrap">
        <Image className="auth-page__brand-image" mode="aspectFit" src={brandImage} />
      </View>
    </View>
  )
}
