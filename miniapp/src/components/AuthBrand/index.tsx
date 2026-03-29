import { Image, View } from '@tarojs/components'
import brandImage from '../../assets/images/company.jpg'

const BRAND_ACCENT = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 110">
  <path d="M20 78h72" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.95"/>
  <path d="M20 50l18 18 22-22 17 17 24-18" fill="none" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.98"/>
</svg>
`)}`

export default function AuthBrand(props) {
  const { variant = 'main' } = props

  return (
    <View className={`auth-page__brand auth-page__brand--${variant}`}>
      <View className="auth-page__brand-image-wrap">
        <Image className="auth-page__brand-image" mode="aspectFill" src={brandImage} />
        <View className="auth-page__brand-accent">
          <Image className="auth-page__brand-accent-image" mode="aspectFit" src={BRAND_ACCENT} />
        </View>
      </View>
    </View>
  )
}
