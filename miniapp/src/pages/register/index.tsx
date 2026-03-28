import { useState, useEffect } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtInput, AtButton, AtTextarea } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { getRegistrationContext, saveRegistrationContext } from '../../utils/registration'
import './index.scss'

const BUSINESS_ADDRESS_MAX_LENGTH = 64
const REQUIRED_MARK = '＊'

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
    <View className="page page--secondary auth-page register-page">
      <TopBar title="企业注册" showBack variant="secondary" />
      <View className="secondary-page__body auth-page__body register-page__body">
        <View className="auth-page__band auth-page__band--brand">
          <View className="auth-page__brand auth-page__brand--medium">
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
          <View className="secondary-card form-card auth-page__card auth-page__card--primary register-page__card">
            <View className="auth-page__section register-page__header">
              <Text className="auth-page__title">
                {isResubmit ? '重新提交注册审核资料' : '先注册，再等待后台审核'}
              </Text>
              <Text className="auth-page__desc">请填写账号和企业资料，审核通过后即可登录使用。</Text>
            </View>
            {isResubmit ? (
              <View className="auth-page__notice auth-page__notice--info">
                <Text className="auth-page__notice-title">已进入重新提交流程</Text>
                <Text className="auth-page__notice-text">已自动带出上次提交的信息，请修正后重新提交。</Text>
              </View>
            ) : null}
            <View className="auth-form register-page__form">
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">
                  <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                  登录名
                </Text>
                <AtInput
                  name="username"
                  placeholder="请输入登录名"
                  value={username}
                  cursor={usernameCursor}
                  onChange={syncInput(setUsername, setUsernameCursor)}
                />
              </View>
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">
                  <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                  登录密码
                </Text>
                <AtInput
                  name="password"
                  type="password"
                  placeholder="请输入登录密码"
                  value={password}
                  cursor={passwordCursor}
                  onChange={syncInput(setPassword, setPasswordCursor)}
                />
              </View>
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">
                  <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                  手机号
                </Text>
                <AtInput
                  name="mobile"
                  type="phone"
                  placeholder="请输入手机号"
                  value={mobile}
                  cursor={mobileCursor}
                  onChange={syncInput(setMobile, setMobileCursor)}
                />
              </View>
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">
                  <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                  统一社会信用代码
                </Text>
                <AtInput
                  name="creditCode"
                  placeholder="请输入18位统一社会信用代码"
                  value={creditCode}
                  cursor={creditCodeCursor}
                  onChange={syncInput(setCreditCode, setCreditCodeCursor)}
                  maxLength={18}
                />
              </View>
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">
                  <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                  法人姓名
                </Text>
                <AtInput
                  name="legalPersonName"
                  placeholder="请输入法人姓名"
                  value={legalPersonName}
                  cursor={legalPersonNameCursor}
                  onChange={syncInput(setLegalPersonName, setLegalPersonNameCursor)}
                />
              </View>
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">法人手机号</Text>
                <AtInput
                  name="legalPersonPhone"
                  type="phone"
                  placeholder="请输入法人手机号"
                  value={legalPersonPhone}
                  cursor={legalPersonPhoneCursor}
                  onChange={syncInput(setLegalPersonPhone, setLegalPersonPhoneCursor)}
                />
              </View>
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">经营范围</Text>
                <AtInput
                  name="businessScope"
                  placeholder="请输入经营范围"
                  value={businessScope}
                  cursor={businessScopeCursor}
                  onChange={syncInput(setBusinessScope, setBusinessScopeCursor)}
                />
              </View>
              <View className="auth-form__field register-page__field">
                <Text className="auth-form__label register-page__label">
                  <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                  经营场所地址
                </Text>
                <AtTextarea
                  placeholder="请输入经营场所地址"
                  value={businessAddress}
                  onChange={(v) => setBusinessAddress(v)}
                  maxLength={BUSINESS_ADDRESS_MAX_LENGTH}
                  height={108}
                  className="auth-form__textarea register-page__textarea"
                />
              </View>
              <AtButton type="primary" full onClick={handleSubmit} loading={loading} className="register-page__submit">
                {isResubmit ? '重新提交审核' : '提交注册审核'}
              </AtButton>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
