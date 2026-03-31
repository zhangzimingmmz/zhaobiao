import { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtInput, AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import AuthBrand from '../../components/AuthBrand'
import AgreementConsent from '../../components/AgreementConsent'
import { api } from '../../services/api'
import { saveRegistrationContext } from '../../utils/registration'
import { hasAuthToken, HOME_PAGE_URL } from '../../utils/auth'
import './index.scss'

const USER_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="20" r="10" fill="#B5BFCD"/>
  <path d="M16 48c0-8.8 7.2-16 16-16s16 7.2 16 16v2H16v-2Z" fill="#B5BFCD"/>
</svg>
`)}`

const EYE_OFF_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M8 32s8-14 24-14 24 14 24 14-8 14-24 14S8 32 8 32Z" fill="none" stroke="#B5BFCD" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="7" fill="none" stroke="#B5BFCD" stroke-width="5"/>
  <path d="M14 50 50 14" stroke="#B5BFCD" stroke-width="5" stroke-linecap="round"/>
</svg>
`)}`

const EYE_ON_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <path d="M8 32s8-14 24-14 24 14 24 14-8 14-24 14S8 32 8 32Z" fill="none" stroke="#4E92E8" stroke-width="5" stroke-linejoin="round"/>
  <circle cx="32" cy="32" r="7" fill="none" stroke="#4E92E8" stroke-width="5"/>
</svg>
`)}`

export default function Login() {
  const [username, setUsername] = useState('')
  const [usernameCursor, setUsernameCursor] = useState(0)
  const [password, setPassword] = useState('')
  const [passwordCursor, setPasswordCursor] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [agreementAccepted, setAgreementAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const canGoBack = typeof getCurrentPages === 'function' ? getCurrentPages().length > 1 : false

  useEffect(() => {
    if (hasAuthToken()) {
      Taro.switchTab({ url: HOME_PAGE_URL })
    }
  }, [])

  const syncInput = (setValue, setCursor) => (value, event) => {
    const nextValue = String(value ?? '')
    setValue(nextValue)
    setCursor(event?.detail?.cursor ?? nextValue.length)
  }

  const handleLogin = () => {
    if (!username || !password) {
      Taro.showToast({ title: '请填写登录名和密码', icon: 'none' })
      return
    }
    if (!agreementAccepted) {
      Taro.showToast({ title: '请先勾选用户协议和隐私政策', icon: 'none' })
      return
    }

    setLoading(true)
    api.login({ username, password })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data?.token) {
          Taro.setStorageSync('token', res.data.data.token)
          api.me()
            .then((profileRes) => {
              const status = profileRes.data?.data?.status

              if (status === 'pending') {
                Taro.showToast({ title: '登录成功，账号审核中', icon: 'none', duration: 2000 })
                setTimeout(() => Taro.redirectTo({ url: '/pages/audit-status/index' }), 900)
                return
              }

              if (status === 'rejected' || status === 'none') {
                const isRejected = status === 'rejected'
                Taro.showToast({
                  title: isRejected ? '登录成功，请先查看驳回原因' : '登录成功，请完成企业认证',
                  icon: 'none',
                  duration: 2000,
                })
                setTimeout(
                  () => Taro.redirectTo({ url: isRejected ? '/pages/audit-status/index' : '/pages/register/index' }),
                  900,
                )
                return
              }

              Taro.showToast({ title: '登录成功' })
              setTimeout(() => Taro.switchTab({ url: HOME_PAGE_URL }), 500)
            })
            .catch(() => {
              Taro.showToast({ title: '登录成功' })
              setTimeout(() => Taro.switchTab({ url: HOME_PAGE_URL }), 500)
            })
          return
        }

        if (res.data?.code === 403 && res.data?.data?.applicationId) {
          saveRegistrationContext({
            applicationId: res.data.data.applicationId,
            username,
          })
          const title = res.data?.data?.status === 'rejected' ? '账号审核未通过，请先查看驳回原因' : '账号审核中'
          const target = '/pages/audit-status/index'
          Taro.showToast({ title, icon: 'none', duration: 2000 })
          setTimeout(() => Taro.redirectTo({ url: target }), 1000)
          return
        }

        Taro.showToast({ title: res.data?.message || '登录失败', icon: 'none' })
      })
      .catch(() => Taro.showToast({ title: '登录失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }

  return (
    <View className="page page--secondary auth-page login-page">
      <TopBar title="登录" showBack={canGoBack} variant="secondary" />
      <View className="secondary-page__body auth-page__body login-page__body">
        <View className="auth-page__band auth-page__band--brand login-page__band">
          <AuthBrand />
        </View>
        <View className="auth-page__band auth-page__band--content login-page__band login-page__band--form">
          <View className="secondary-card form-card auth-page__card auth-page__card--primary login-page__form">
            <View className="auth-form login-page__form-main">
              <View className="auth-form__field login-page__field">
                <View className="login-page__input-wrap">
                  <AtInput
                    name="username"
                    type="text"
                    placeholder="请输入登录名"
                    value={username}
                    cursor={usernameCursor}
                    onChange={syncInput(setUsername, setUsernameCursor)}
                  />
                  <View className="login-page__input-icon login-page__input-icon--static">
                    <Image className="login-page__input-icon-image" mode="aspectFit" src={USER_ICON} />
                  </View>
                </View>
              </View>
              <View className="auth-form__field login-page__field">
                <View className="login-page__input-wrap">
                  <AtInput
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入登录密码"
                    value={password}
                    cursor={passwordCursor}
                    onChange={syncInput(setPassword, setPasswordCursor)}
                  />
                  <View className="login-page__input-icon" onClick={() => setShowPassword((value) => !value)}>
                    <Image
                      className="login-page__input-icon-image"
                      mode="aspectFit"
                      src={showPassword ? EYE_ON_ICON : EYE_OFF_ICON}
                    />
                  </View>
                </View>
              </View>
              <AgreementConsent
                checked={agreementAccepted}
                onToggle={() => setAgreementAccepted((value) => !value)}
              />
              <AtButton type="primary" full onClick={handleLogin} loading={loading} className="login-page__submit">
                登录
              </AtButton>
            </View>
            <View className="login-page__form-foot">
              <View className="login-page__actions-row">
                <View className="login-page__register" onClick={() => Taro.redirectTo({ url: '/pages/register/index' })}>
                  <Text className="login-page__register-prefix">还没有账号？</Text>
                  <Text className="login-page__action-link">去注册</Text>
                </View>
                <View
                  className="login-page__forgot"
                  onClick={() => Taro.redirectTo({ url: '/pages/forgot-password/index' })}
                >
                  <Text className="login-page__action-link">忘记密码</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
