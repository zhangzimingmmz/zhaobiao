import { useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtInput, AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { saveRegistrationContext } from '../../utils/registration'
import './index.scss'

export default function Login() {
  const [username, setUsername] = useState('')
  const [usernameCursor, setUsernameCursor] = useState(0)
  const [password, setPassword] = useState('')
  const [passwordCursor, setPasswordCursor] = useState(0)
  const [loading, setLoading] = useState(false)

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
          Taro.showToast({ title: '登录成功' })
          setTimeout(() => Taro.switchTab({ url: '/pages/index/index' }), 500)
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
    <View className="page page--secondary login-page">
      <TopBar title="登录" showBack variant="secondary" />
      <View className="secondary-page__body login-page__body">
        <View className="secondary-page__intro login-page__intro">
          <Text className="secondary-page__eyebrow">AUTHENTICATION</Text>
          <Text className="secondary-page__title">审核通过后使用账号密码登录</Text>
          <Text className="secondary-page__desc">
            只有后台审核通过的账号才能登录。登录时系统会自动提示审核状态。
          </Text>
        </View>
        <View className="secondary-card form-card login-page__form">
          <AtInput
            name="username"
            type="text"
            placeholder="请输入登录名"
            value={username}
            cursor={usernameCursor}
            onChange={syncInput(setUsername, setUsernameCursor)}
          />
          <AtInput
            name="password"
            type="password"
            placeholder="请输入登录密码"
            value={password}
            cursor={passwordCursor}
            onChange={syncInput(setPassword, setPasswordCursor)}
          />
          <AtButton type="primary" full onClick={handleLogin} loading={loading} className="login-page__submit">
            登录
          </AtButton>
          <View className="login-page__register" onClick={() => Taro.redirectTo({ url: '/pages/register/index' })}>
            <Text className="login-page__register-label">还没有账号？去注册</Text>
          </View>
          <View className="login-page__agreement">
            <Text className="text-caption">登录即表示同意</Text>
            <Text className="text-primary">《用户协议》</Text>
            <Text className="text-caption"> 与 </Text>
            <Text className="text-primary">《隐私政策》</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
