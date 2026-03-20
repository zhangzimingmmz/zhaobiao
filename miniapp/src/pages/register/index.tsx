import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtInput, AtButton, AtTextarea } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { getRegistrationContext, saveRegistrationContext } from '../../utils/registration'
import './index.scss'

export default function Register() {
  const [username, setUsername] = useState('')
  const [usernameCursor, setUsernameCursor] = useState(0)
  const [password, setPassword] = useState('')
  const [passwordCursor, setPasswordCursor] = useState(0)
  const [mobile, setMobile] = useState('')
  const [mobileCursor, setMobileCursor] = useState(0)
  const [creditCode, setCreditCode] = useState('')
  const [creditCodeCursor, setCreditCodeCursor] = useState(0)
  const [legalPersonName, setLegalPersonName] = useState('')
  const [legalPersonNameCursor, setLegalPersonNameCursor] = useState(0)
  const [legalPersonPhone, setLegalPersonPhone] = useState('')
  const [legalPersonPhoneCursor, setLegalPersonPhoneCursor] = useState(0)
  const [businessScope, setBusinessScope] = useState('')
  const [businessScopeCursor, setBusinessScopeCursor] = useState(0)
  const [businessAddress, setBusinessAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [isResubmit, setIsResubmit] = useState(false)

  const syncInput = (setValue, setCursor) => (value, event) => {
    const nextValue = String(value ?? '')
    setValue(nextValue)
    setCursor(event?.detail?.cursor ?? nextValue.length)
  }

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
        <View className="secondary-card form-card register-page__form">
          <AtInput
            name="username"
            placeholder="登录名 *"
            value={username}
            cursor={usernameCursor}
            onChange={syncInput(setUsername, setUsernameCursor)}
          />
          <AtInput
            name="password"
            type="password"
            placeholder="登录密码 *"
            value={password}
            cursor={passwordCursor}
            onChange={syncInput(setPassword, setPasswordCursor)}
          />
          <AtInput
            name="mobile"
            type="phone"
            placeholder="注册用户手机号码 *"
            value={mobile}
            cursor={mobileCursor}
            onChange={syncInput(setMobile, setMobileCursor)}
          />
          <AtInput
            name="creditCode"
            placeholder="营业执照代码 / 统一社会信用代码 *"
            value={creditCode}
            cursor={creditCodeCursor}
            onChange={syncInput(setCreditCode, setCreditCodeCursor)}
            maxLength={18}
          />
          <AtInput
            name="legalPersonName"
            placeholder="法人姓名 *"
            value={legalPersonName}
            cursor={legalPersonNameCursor}
            onChange={syncInput(setLegalPersonName, setLegalPersonNameCursor)}
          />
          <AtInput
            name="legalPersonPhone"
            type="phone"
            placeholder="法人电话号码（非必填）"
            value={legalPersonPhone}
            cursor={legalPersonPhoneCursor}
            onChange={syncInput(setLegalPersonPhone, setLegalPersonPhoneCursor)}
          />
          <AtInput
            name="businessScope"
            placeholder="营业执照经营范围（非必填）"
            value={businessScope}
            cursor={businessScopeCursor}
            onChange={syncInput(setBusinessScope, setBusinessScopeCursor)}
          />
          <AtTextarea
            placeholder="经营场所地址 *"
            value={businessAddress}
            onChange={(v) => setBusinessAddress(v)}
            maxLength={200}
            height={120}
            className="register-page__textarea"
          />
          <AtButton type="primary" full onClick={handleSubmit} loading={loading} className="register-page__submit">
            {isResubmit ? '重新提交审核' : '提交注册审核'}
          </AtButton>
        </View>
      </View>
    </View>
  )
}
