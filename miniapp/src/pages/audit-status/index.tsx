import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { getRegistrationContext } from '../../utils/registration'
import './index.scss'

export default function AuditStatus() {
  const [status, setStatus] = useState('none')
  const [data, setData] = useState(null)
  const [nextAction, setNextAction] = useState('register')

  useEffect(() => {
    const context = getRegistrationContext()
    if (!context.applicationId || (!context.username && !context.mobile)) {
      setStatus('none')
      return
    }

    api.auditStatus(context)
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data) {
          const { status: st, nextAction: na, ...rest } = res.data.data
          setStatus(st || 'none')
          setNextAction(na || 'register')
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
      eyebrow: 'NOT FOUND',
      title: '未找到注册申请',
      description: '请先提交企业注册资料，提交成功后即可在这里查看审核状态。',
      actionLabel: '去注册',
      action: handleRegister,
    },
    pending: {
      eyebrow: 'UNDER REVIEW',
      title: '账号审核中',
      description: '你的注册资料已提交，平台审核通过后才能使用账号密码登录。',
      actionLabel: '返回登录页',
      action: handleLogin,
    },
    approved: {
      eyebrow: 'APPROVED',
      title: '账号审核已通过',
      description: '你现在可以使用登录名和密码登录平台。',
      actionLabel: '立即登录',
      action: handleLogin,
    },
    rejected: {
      eyebrow: 'NEEDS UPDATE',
      title: '账号审核未通过',
      description: '请根据驳回原因修正资料后重新提交，我们会再次进行审核。',
      actionLabel: '重新提交',
      action: handleResubmit,
    },
  }

  const meta = stateMeta[status] || stateMeta.none

  return (
    <View className="page page--secondary audit-status-page">
      <TopBar title="审核状态" showBack variant="secondary" />
      <View className="secondary-page__body audit-status-page__body">
        <View className="secondary-page__intro audit-status-page__intro">
          <Text className="secondary-page__eyebrow">{meta.eyebrow}</Text>
          <Text className="secondary-page__title">{meta.title}</Text>
          <Text className="secondary-page__desc">{meta.description}</Text>
        </View>
        <View className={'secondary-card audit-status audit-status--' + status}>
          {status === 'pending' && (
            <View className="audit-status__timeline">
              <View className="audit-status__step audit-status__step--done">
                <Text className="audit-status__step-label">注册资料已提交</Text>
                <Text className="audit-status__step-help">账号和企业资料已经进入审核队列</Text>
              </View>
              <View className="audit-status__step audit-status__step--current">
                <Text className="audit-status__step-label">平台审核中</Text>
                <Text className="audit-status__step-help">审核通过后才能使用账号密码登录</Text>
              </View>
              <View className="audit-status__step">
                <Text className="audit-status__step-label">开通登录</Text>
                <Text className="audit-status__step-help">通过后即可前往登录页</Text>
              </View>
            </View>
          )}

          {data && (data.username || data.creditCode || data.auditTime) && (
            <View className="audit-status__summary">
              {data.username && <Text className="audit-status__summary-row">登录名：{data.username}</Text>}
              {data.mobile && <Text className="audit-status__summary-row">注册手机号：{data.mobile}</Text>}
              {data.creditCode && <Text className="audit-status__summary-row">营业执照代码：{data.creditCode}</Text>}
              {data.legalPersonName && <Text className="audit-status__summary-row">法人姓名：{data.legalPersonName}</Text>}
              {data.businessAddress && <Text className="audit-status__summary-row">经营场所地址：{data.businessAddress}</Text>}
              {data.createdAt && <Text className="audit-status__summary-row">提交时间：{data.createdAt}</Text>}
              {data.auditTime && <Text className="audit-status__summary-row">审核时间：{data.auditTime}</Text>}
            </View>
          )}

          {status === 'rejected' && data?.rejectReason && (
            <View className="audit-status__reason">
              <Text className="audit-status__reason-label">驳回原因</Text>
              <Text className="audit-status__reason-text">{data.rejectReason}</Text>
            </View>
          )}

          <View className="audit-status__actions">
            <View className="btn-primary audit-status__primary" onClick={meta.action}>
              {meta.actionLabel}
            </View>
            {status === 'approved' ? (
              <View className="btn-secondary audit-status__secondary" onClick={handleEnterHome}>
                进入首页
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  )
}
