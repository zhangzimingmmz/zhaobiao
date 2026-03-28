import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtInput, AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { saveRegistrationContext } from '../../utils/registration'
import { hasAuthToken, HOME_PAGE_URL } from '../../utils/auth'
import './index.scss'

export default function Login() {
  const [username, setUsername] = useState('')
  const [usernameCursor, setUsernameCursor] = useState(0)
  const [password, setPassword] = useState('')
  const [passwordCursor, setPasswordCursor] = useState(0)
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
                Taro.showToast({ title: '登录成功，请完成企业认证', icon: 'none', duration: 2000 })
                setTimeout(() => Taro.redirectTo({ url: '/pages/register/index' }), 900)
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
          const title = res.data?.data?.status === 'rejected' ? '账号审核未通过，请重新提交资料' : '账号审核中'
          const target =
            res.data?.data?.status === 'rejected' ? '/pages/register/index' : '/pages/audit-status/index'
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
          <View className="auth-page__brand auth-page__brand--main">
            <View className="auth-page__brand-visual">
              <View className="auth-page__brand-orb auth-page__brand-orb--left" />
              <View className="auth-page__brand-orb auth-page__brand-orb--right" />
              <View className="auth-page__brand-mark">
                <View className="auth-page__brand-mark-arch" />
                <View className="auth-page__brand-mark-road" />
              </View>
            </View>
            <Text className="auth-page__brand-title">金堂招讯通</Text>
          </View>
        </View>
        <View className="auth-page__band auth-page__band--content login-page__band login-page__band--form">
          <View className="secondary-card form-card auth-page__card auth-page__card--primary login-page__form">
            <View className="auth-form login-page__form-main">
              <View className="auth-form__field login-page__field">
                <AtInput
                  name="username"
                  type="text"
                  placeholder="请输入登录名"
                  value={username}
                  cursor={usernameCursor}
                  onChange={syncInput(setUsername, setUsernameCursor)}
                />
              </View>
              <View className="auth-form__field login-page__field">
                <AtInput
                  name="password"
                  type="password"
                  placeholder="请输入登录密码"
                  value={password}
                  cursor={passwordCursor}
                  onChange={syncInput(setPassword, setPasswordCursor)}
                />
              </View>
              <AtButton type="primary" full onClick={handleLogin} loading={loading} className="login-page__submit">
                登录
              </AtButton>
            </View>
            <View className="login-page__form-foot">
              <View className="login-page__register" onClick={() => Taro.redirectTo({ url: '/pages/register/index' })}>
                <Text className="login-page__register-prefix">还没有账号？</Text>
                <Text className="login-page__register-action">去注册</Text>
              </View>
              <View className="login-page__agreement">
                <Text className="login-page__agreement-text">登录即表示同意</Text>
                <Text className="login-page__agreement-link">《用户协议》</Text>
                <Text className="login-page__agreement-text"> 与 </Text>
                <Text className="login-page__agreement-link">《隐私政策》</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
