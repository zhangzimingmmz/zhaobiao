import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { AtInput, AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import AvatarInitials from '../../components/AvatarInitials'
import AppIcon from '../../components/AppIcon'
import { api } from '../../services/api'
import { getRegistrationContext, saveRegistrationContext } from '../../utils/registration'
import { formatDateTime } from '../../utils/formatDate'
import './index.scss'

export default function Profile() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!Taro.getStorageSync('token'))
  const [auditData, setAuditData] = useState(null)
  const [auditStatus, setAuditStatus] = useState('')
  const [nextAction, setNextAction] = useState('')
  const [auditLoading, setAuditLoading] = useState(false)
  
  // 登录表单状态
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  useDidShow(() => {
    setIsLoggedIn(!!Taro.getStorageSync('token'))
  })

  useEffect(() => {
    if (isLoggedIn) {
      setAuditLoading(true)
      api.me()
        .then((res) => {
          if (res.data?.code === 200 && res.data?.data) {
            const { status, nextAction: na, ...rest } = res.data.data
            setAuditData(rest)
            setAuditStatus(status || '')
            setNextAction(na || '')
          } else {
            setAuditData(null)
            setAuditStatus('')
            setNextAction('')
          }
        })
        .catch(() => {
          setAuditData(null)
          setAuditStatus('')
          setNextAction('')
        })
        .finally(() => setAuditLoading(false))
      return
    }

    const context = getRegistrationContext()
    if (!context.applicationId || (!context.username && !context.mobile)) {
      setAuditData(null)
      setAuditStatus('')
      setNextAction('')
      return
    }

    setAuditLoading(true)
    api.auditStatus(context)
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          const { status, nextAction: na, ...rest } = res.data.data
          setAuditData(rest)
          setAuditStatus(status || '')
          setNextAction(na || '')
        } else {
          setAuditData(null)
          setAuditStatus('')
          setNextAction('')
        }
      })
      .catch(() => {
        setAuditData(null)
        setAuditStatus('')
        setNextAction('')
      })
      .finally(() => setAuditLoading(false))
  }, [isLoggedIn])

  const handleSettings = () => Taro.showToast({ title: '设置', icon: 'none' })
  const handleContact = () => Taro.showToast({ title: '联系客服', icon: 'none' })
  
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          Taro.removeStorageSync('token')
          setIsLoggedIn(false)
          setUsername('')
          setPassword('')
          setAuditData(null)
          setAuditStatus('')
          setNextAction('')
        }
      },
    })
  }

  const handleLogin = () => {
    if (!username || !password) {
      Taro.showToast({ title: '请填写登录名和密码', icon: 'none' })
      return
    }

    setLoginLoading(true)
    api.login({ username, password })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data?.token) {
          Taro.setStorageSync('token', res.data.data.token)
          Taro.showToast({ title: '登录成功' })
          setIsLoggedIn(true)
          setUsername('')
          setPassword('')
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
      .finally(() => setLoginLoading(false))
  }

  const handleVerificationAction = () => {
    if (nextAction === 'resubmit') {
      Taro.redirectTo({ url: '/pages/register/index' })
    } else if (nextAction === 'wait') {
      Taro.redirectTo({ url: '/pages/audit-status/index' })
    } else if (nextAction === 'login') {
      Taro.redirectTo({ url: '/pages/login/index' })
    } else {
      Taro.redirectTo({ url: '/pages/register/index' })
    }
  }

  const getStatusLabel = () => {
    if (auditStatus === 'approved') return '已通过'
    if (auditStatus === 'pending') return '审核中'
    if (auditStatus === 'rejected') return '未通过'
    return '未注册'
  }

  const getActionLabel = () => {
    if (nextAction === 'resubmit') return '重新提交'
    if (nextAction === 'wait') return '查看审核状态'
    if (nextAction === 'login') return isLoggedIn ? '进入首页' : '去登录'
    return '去注册'
  }

  const handlePrimaryAction = () => {
    if (nextAction === 'login' && isLoggedIn) {
      Taro.switchTab({ url: '/pages/index/index' })
      return
    }
    handleVerificationAction()
  }

  // 未登录状态 - 显示登录表单
  if (!isLoggedIn && !auditStatus) {
    return (
      <View className="page page--tab profile-page">
        <TopBar title="我的" variant="tab" />
        <View className="profile-page__login-section">
          <View className="profile-page__login-intro">
            <Text className="profile-page__section-label">账号状态</Text>
            <Text className="profile-page__guest-title">未登录</Text>
            <Text className="profile-page__guest-desc">
              审核通过后使用账号密码登录，即可查看招投标内容。
            </Text>
          </View>
          
          <View className="profile-page__login-form card form-card">
            <AtInput name="username" placeholder="请输入登录名" value={username} onChange={(v) => setUsername(v)} />
            <AtInput name="password" type="password" placeholder="请输入登录密码" value={password} onChange={(v) => setPassword(v)} />
            <AtButton type="primary" full onClick={handleLogin} loading={loginLoading} className="profile-page__login-btn">
              登录
            </AtButton>
            
            <View className="profile-page__actions">
              <Text 
                className="profile-page__link" 
                onClick={() => Taro.navigateTo({ url: '/pages/register/index' })}
              >
                还没有账号？去注册
              </Text>
            </View>
            
            <View className="profile-page__agreement">
              <Text className="text-caption">登录即表示同意</Text>
              <Text className="text-primary">《用户协议》</Text>
              <Text className="text-caption"> 与 </Text>
              <Text className="text-primary">《隐私政策》</Text>
            </View>
          </View>
        </View>
        
        <Text className="profile-page__version text-caption">版本 0.0.1</Text>
      </View>
    )
  }

  // 已登录状态 - 显示用户信息
  return (
    <View className="page page--tab profile-page">
      <TopBar title="我的" variant="tab" />
      <View className="profile-page__summary card">
        <View className="profile-page__header">
          <AvatarInitials
            name={auditData?.legalPersonName}
            userId={auditData?.applicationId}
            username={auditData?.username}
            mobile={auditData?.mobile}
          />
          <View className="profile-page__header-info">
            <View className="profile-page__header-name-row">
              <Text className="profile-page__legal-name">
                {auditData?.legalPersonName || auditData?.username || (auditLoading ? '加载中...' : '—')}
              </Text>
              <Text className={'profile-page__badge' + (auditStatus === 'approved' ? ' profile-page__badge--approved' : auditStatus === 'pending' ? ' profile-page__badge--pending' : auditStatus === 'rejected' ? ' profile-page__badge--rejected' : '')}>{getStatusLabel()}</Text>
            </View>
            <Text className="profile-page__mobile">{auditData?.mobile || '—'}</Text>
          </View>
        </View>
        <Text className="profile-page__summary-desc">
          {auditStatus === 'approved'
            ? '当前账号已通过审核，可以正常登录并使用平台能力。'
            : auditStatus === 'pending'
              ? '注册资料审核中，审核通过前不能登录。'
              : auditStatus === 'rejected'
                ? '账号审核未通过，请根据驳回原因重新提交资料。'
                : '还未提交注册资料。'}
        </Text>
      </View>

      {auditStatus && auditStatus !== 'approved' ? (
        <View className={'profile-page__status-card card profile-page__status-card--' + auditStatus}>
          <Text className="profile-page__section-label">审核状态</Text>
          <Text className="profile-page__status-title">
            {auditStatus === 'pending' ? '账号审核中' : '账号审核未通过'}
          </Text>
          <Text className="profile-page__status-desc">
            {auditStatus === 'rejected'
              ? auditData?.rejectReason || '请根据驳回原因调整资料后重新提交。'
              : '可进入审核状态页查看当前处理进度。'}
          </Text>
          <AtButton type="primary" full onClick={handlePrimaryAction} className="profile-page__register-btn">
            {getActionLabel()}
          </AtButton>
        </View>
      ) : null}

      {auditData ? (
        <View className="profile-page__info card">
          <Text className="profile-page__section-label">资料摘要</Text>
          <View className="profile-page__row">
            <Text className="profile-page__row-label">登录名</Text>
            <Text className="profile-page__row-value">{auditData.username || '—'}</Text>
          </View>
          <View className="profile-page__row">
            <Text className="profile-page__row-label">营业执照代码</Text>
            <Text className="profile-page__row-value">{auditData.creditCode || '—'}</Text>
          </View>
          <View className="profile-page__row">
            <Text className="profile-page__row-label">审核时间</Text>
            <Text className="profile-page__row-value">{auditData.auditTime ? formatDateTime(auditData.auditTime) : '—'}</Text>
          </View>
        </View>
      ) : null}

      {isLoggedIn ? (
        <>
          <View className="profile-page__menu">
            <View className="profile-page__item" onClick={handleSettings}>
              <AppIcon name="settings" size={36} color="#4E5969" />
              <Text className="profile-page__item-text">设置</Text>
              <AppIcon name="chevronright" size={28} color="#86909C" />
            </View>
            <View className="profile-page__item" onClick={handleContact}>
              <AppIcon name="messagecircle" size={36} color="#4E5969" />
              <Text className="profile-page__item-text">联系客服</Text>
              <AppIcon name="chevronright" size={28} color="#86909C" />
            </View>
          </View>
          <View className="profile-page__logout-card card" onClick={handleLogout}>
            <Text className="profile-page__logout-text">退出登录</Text>
          </View>
        </>
      ) : null}
      <Text className="profile-page__version text-caption">版本 0.0.1</Text>
    </View>
  )
}
