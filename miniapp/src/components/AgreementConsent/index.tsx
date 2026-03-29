import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import AppIcon from '../AppIcon'

export default function AgreementConsent({
  checked,
  onToggle,
  prefix = '我已阅读并同意',
}) {
  const openAgreement = (url) => (event) => {
    event?.stopPropagation?.()
    Taro.navigateTo({ url })
  }

  return (
    <View className="agreement-consent" onClick={onToggle}>
      <View className="agreement-consent__check">
        <View className="agreement-consent__box">
          <AppIcon
            name={checked ? 'checksquarefill' : 'square'}
            size={42}
            color={checked ? '#1677FF' : '#C9CDD4'}
          />
        </View>
      </View>
      <View className="agreement-consent__copy">
        <Text className="agreement-consent__text">{prefix}</Text>
        <Text
          className="agreement-consent__link"
          onClick={openAgreement('/pages/user-agreement/index')}
        >
          《用户协议》
        </Text>
        <Text className="agreement-consent__text"> 和 </Text>
        <Text
          className="agreement-consent__link"
          onClick={openAgreement('/pages/privacy-policy/index')}
        >
          《隐私政策》
        </Text>
      </View>
    </View>
  )
}
