import { useState } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { saveRegistrationContext } from '../../utils/registration'
import './index.scss'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
            只有后台审核通过的账号才能登录。若账号仍在审核中，可进入审核状态页查看进度。
          </Text>
        </View>
        <View className="secondary-card login-page__form">
          <Input
            className="login-page__input"
            placeholder="请输入登录名"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
          <Input
            className="login-page__input"
            password
            placeholder="请输入登录密码"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
          <Button className="login-page__submit btn-primary" onClick={handleLogin} loading={loading}>
            登录
          </Button>
          <View className="login-page__register" onClick={() => Taro.redirectTo({ url: '/pages/register/index' })}>
            <Text className="login-page__register-label">还没有账号？先去注册并提交审核</Text>
          </View>
          <View className="login-page__register" onClick={() => Taro.redirectTo({ url: '/pages/audit-status/index' })}>
            <Text className="login-page__register-label">查询审核状态</Text>
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
