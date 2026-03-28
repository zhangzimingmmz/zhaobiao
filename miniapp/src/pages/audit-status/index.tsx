import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtSteps, AtButton } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { getRegistrationContext } from '../../utils/registration'
import { formatDateTime } from '../../utils/formatDate'
import './index.scss'

export default function AuditStatus() {
  const [status, setStatus] = useState('none')
  const [data, setData] = useState(null)

  useEffect(() => {
    const context = getRegistrationContext()
    if (!context.applicationId || (!context.username && !context.mobile)) {
      setStatus('none')
      return
    }

    api.auditStatus(context)
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          const { status: st, nextAction: _nextAction, ...rest } = res.data.data
          setStatus(st || 'none')
          setData(rest)
        } else {
          setStatus('none')
        }
      })
      .catch(() => setStatus('none'))
  }, [])

  const handleEnterHome = () => Taro.switchTab({ url: '/pages/index/index' })
  const handleResubmit = () => Taro.redirectTo({ url: '/pages/register/index' })
  const handleLogin = () => Taro.redirectTo({ url: '/pages/login/index' })
  const handleRegister = () => Taro.redirectTo({ url: '/pages/register/index' })

  const stateMeta = {
    none: {
      badge: '未提交',
      title: '未找到注册申请',
      description: '请先提交企业注册资料，提交成功后即可在这里查看审核状态。',
      actionLabel: '去注册',
      action: handleRegister,
    },
    pending: {
      badge: '审核中',
      title: '账号审核中',
      description: '你的注册资料已提交，平台审核通过后才能使用账号密码登录。',
      actionLabel: '返回登录页',
      action: handleLogin,
    },
    approved: {
      badge: '已通过',
      title: '账号审核已通过',
      description: '你现在可以使用登录名和密码登录平台。',
      actionLabel: '立即登录',
      action: handleLogin,
    },
    rejected: {
      badge: '需修改',
      title: '账号审核未通过',
      description: '请根据驳回原因修正资料后重新提交，我们会再次进行审核。',
      actionLabel: '重新提交',
      action: handleResubmit,
    },
  }

  const meta = stateMeta[status] || stateMeta.none

  return (
    <View className="page page--secondary auth-page audit-status-page">
      <TopBar title="审核状态" showBack variant="secondary" />
      <View className="secondary-page__body auth-page__body audit-status-page__body">
        <View className="auth-page__band auth-page__band--brand">
          <View className="auth-page__brand auth-page__brand--light">
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
        <View className="auth-page__band auth-page__band--content">
          <View className={'secondary-card auth-page__card auth-page__card--primary audit-status-page__card audit-status-page__card--' + status}>
            <View className="auth-page__section audit-status-page__header">
              <Text className={'audit-status-page__status-pill audit-status-page__status-pill--' + status}>
                {meta.badge}
              </Text>
              <Text className="auth-page__title">{meta.title}</Text>
              <Text className="auth-page__desc">{meta.description}</Text>
            </View>

          {status === 'pending' && (
            <>
              <View className="audit-status-page__steps">
                <AtSteps
                  current={1}
                  items={[
                    { title: '提交资料', status: 'success' },
                    { title: '审核中' },
                    { title: '开通' },
                  ]}
                  onChange={() => {}}
                />
              </View>

              <View className="auth-page__notice auth-page__notice--warning">
                <Text className="auth-page__notice-title">当前状态：平台审核中</Text>
                <Text className="auth-page__notice-text">审核通过后才能使用账号密码登录</Text>
              </View>
            </>
          )}

          {data && (data.username || data.creditCode || data.createdAt) && (
            <View className="audit-status-page__info">
              <Text className="audit-status-page__info-title">提交的资料</Text>
              {data.username && (
                <Text className="audit-status-page__info-row">
                  <Text className="audit-status-page__info-key">登录名：</Text>
                  {data.username}
                </Text>
              )}
              {data.mobile && (
                <Text className="audit-status-page__info-row">
                  <Text className="audit-status-page__info-key">手机号：</Text>
                  {data.mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}
                </Text>
              )}
              {data.creditCode && (
                <Text className="audit-status-page__info-row">
                  <Text className="audit-status-page__info-key">营业执照代码：</Text>
                  {data.creditCode}
                </Text>
              )}
              {data.legalPersonName && (
                <Text className="audit-status-page__info-row">
                  <Text className="audit-status-page__info-key">法人姓名：</Text>
                  {data.legalPersonName}
                </Text>
              )}
              {data.businessAddress && (
                <Text className="audit-status-page__info-row">
                  <Text className="audit-status-page__info-key">经营场所地址：</Text>
                  {data.businessAddress}
                </Text>
              )}
              {data.createdAt && (
                <Text className="audit-status-page__info-row">
                  <Text className="audit-status-page__info-key">提交时间：</Text>
                  {formatDateTime(data.createdAt)}
                </Text>
              )}
              {data.auditTime && (
                <Text className="audit-status-page__info-row">
                  <Text className="audit-status-page__info-key">审核时间：</Text>
                  {formatDateTime(data.auditTime)}
                </Text>
              )}
            </View>
          )}

          {status === 'rejected' && data?.rejectReason && (
            <View className="auth-page__notice auth-page__notice--error">
              <Text className="auth-page__notice-title">驳回原因</Text>
              <Text className="auth-page__notice-text">{data.rejectReason}</Text>
            </View>
          )}

          <View className="auth-page__actions audit-status-page__actions">
            <AtButton type="primary" full onClick={meta.action} className="audit-status-page__primary">
              {meta.actionLabel}
            </AtButton>
            {status === 'approved' ? (
              <AtButton type="secondary" full onClick={handleEnterHome} className="audit-status-page__secondary">
                进入首页
              </AtButton>
            ) : null}
          </View>
          </View>
        </View>
      </View>
    </View>
  )
}
