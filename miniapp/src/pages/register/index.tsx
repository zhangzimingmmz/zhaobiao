import { useState, useEffect } from 'react'
import { View, Text, Input, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { getRegistrationContext, saveRegistrationContext } from '../../utils/registration'
import './index.scss'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mobile, setMobile] = useState('')
  const [creditCode, setCreditCode] = useState('')
  const [legalPersonName, setLegalPersonName] = useState('')
  const [legalPersonPhone, setLegalPersonPhone] = useState('')
  const [businessScope, setBusinessScope] = useState('')
  const [businessAddress, setBusinessAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [isResubmit, setIsResubmit] = useState(false)

  useEffect(() => {
    const context = getRegistrationContext()
    if (!context.applicationId || (!context.username && !context.mobile)) return

    api.auditStatus(context)
      .then((res) => {
        if (res.data?.code !== 200 || !res.data?.data) return

        const payload = res.data.data
        if (payload.status === 'pending') {
          Taro.showToast({ title: '已有审核中的申请', icon: 'none' })
          setTimeout(() => Taro.redirectTo({ url: '/pages/audit-status/index' }), 1200)
          return
        }

        if (payload.status === 'approved') {
          Taro.showToast({ title: '账号已审核通过，请直接登录', icon: 'none' })
          setTimeout(() => Taro.redirectTo({ url: '/pages/login/index' }), 1200)
          return
        }

        if (payload.status === 'rejected') {
          setIsResubmit(true)
          setUsername(payload.username || context.username || '')
          setMobile(payload.mobile || context.mobile || '')
          setCreditCode(payload.creditCode || '')
          setLegalPersonName(payload.legalPersonName || '')
          setLegalPersonPhone(payload.legalPersonPhone || '')
          setBusinessScope(payload.businessScope || '')
          setBusinessAddress(payload.businessAddress || '')
        }
      })
      .catch(() => {})
  }, [])

  const handleSubmit = () => {
    if (!username || !password || !mobile || !creditCode || !legalPersonName || !businessAddress) {
      Taro.showToast({ title: '请完整填写必填信息', icon: 'none' })
      return
    }
    if (!/^1\d{10}$/.test(mobile)) {
      Taro.showToast({ title: '请输入正确手机号', icon: 'none' })
      return
    }
    if (!/^[0-9A-Z]{18}$/.test(creditCode)) {
      Taro.showToast({ title: '请输入18位统一社会信用代码', icon: 'none' })
      return
    }
    if (legalPersonPhone && !/^1\d{10}$/.test(legalPersonPhone)) {
      Taro.showToast({ title: '请输入正确法人手机号', icon: 'none' })
      return
    }

    setLoading(true)
    api.register({
      username,
      password,
      mobile,
      creditCode,
      legalPersonName,
      legalPersonPhone: legalPersonPhone || undefined,
      businessScope: businessScope || undefined,
      businessAddress,
    })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data?.applicationId) {
          saveRegistrationContext({
            applicationId: res.data.data.applicationId,
            username,
            mobile,
          })
          Taro.showToast({ title: isResubmit ? '重新提交成功' : '注册成功', icon: 'success' })
          setTimeout(() => Taro.redirectTo({ url: '/pages/audit-status/index' }), 600)
          return
        }

        if (res.data?.code === 409 && res.data?.data?.applicationId) {
          saveRegistrationContext({
            applicationId: res.data.data.applicationId,
            username,
            mobile,
          })
          Taro.showToast({ title: res.data.message || '已有审核中的申请', icon: 'none' })
          setTimeout(() => Taro.redirectTo({ url: '/pages/audit-status/index' }), 1200)
          return
        }

        Taro.showToast({ title: res.data?.message || '提交失败', icon: 'none' })
      })
      .catch(() => Taro.showToast({ title: '提交失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }

  return (
    <View className="page page--secondary register-page">
      <TopBar title="企业注册" showBack variant="secondary" />
      <View className="secondary-page__body register-page__body">
        <View className="secondary-page__intro register-page__intro">
          <Text className="secondary-page__eyebrow">ENTERPRISE REGISTRATION</Text>
          <Text className="secondary-page__title">
            {isResubmit ? '重新提交注册审核资料' : '先注册，再等待后台审核'}
          </Text>
          <Text className="secondary-page__desc">
            注册时请填写账号和企业资料。审核通过后，才能使用登录名和密码进入平台。
          </Text>
        </View>
        <View className="register-page__tip">
          <Text>
            {isResubmit ? '已自动带出上次提交的信息，请修正后重新提交。' : '带 * 的字段为必填。'}
          </Text>
        </View>
        <View className="secondary-card register-page__form">
          <Input
            className="register-page__input"
            placeholder="登录名 *"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
          />
          <Input
            className="register-page__input"
            password
            placeholder="登录密码 *"
            value={password}
            onInput={(e) => setPassword(e.detail.value)}
          />
          <Input
            className="register-page__input"
            type="number"
            maxlength={11}
            placeholder="注册用户手机号码 *"
            value={mobile}
            onInput={(e) => setMobile(e.detail.value)}
          />
          <Input
            className="register-page__input"
            type="idcard"
            maxlength={18}
            placeholder="营业执照代码 / 统一社会信用代码 *"
            value={creditCode}
            onInput={(e) => setCreditCode(e.detail.value)}
          />
          <Input
            className="register-page__input"
            placeholder="法人姓名 *"
            value={legalPersonName}
            onInput={(e) => setLegalPersonName(e.detail.value)}
          />
          <Input
            className="register-page__input"
            type="number"
            maxlength={11}
            placeholder="法人电话号码（非必填）"
            value={legalPersonPhone}
            onInput={(e) => setLegalPersonPhone(e.detail.value)}
          />
          <Input
            className="register-page__input"
            placeholder="营业执照经营范围（非必填）"
            value={businessScope}
            onInput={(e) => setBusinessScope(e.detail.value)}
          />
          <Input
            className="register-page__input register-page__input--multiline"
            placeholder="经营场所地址 *"
            value={businessAddress}
            onInput={(e) => setBusinessAddress(e.detail.value)}
          />
          <Button className="register-page__submit btn-primary" onClick={handleSubmit} loading={loading}>
            {isResubmit ? '重新提交审核' : '提交注册审核'}
          </Button>
        </View>
      </View>
    </View>
  )
}
