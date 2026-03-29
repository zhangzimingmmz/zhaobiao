import { useEffect, useState } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { AtButton, AtInput } from 'taro-ui'
import TopBar from '../../components/TopBar'
import { api } from '../../services/api'
import { normalizeSupportContacts, presentSupportContacts } from '../../utils/contact'
import './index.scss'

const REQUIRED_MARK = '＊'

export default function ForgotPassword() {
  const [username, setUsername] = useState('')
  const [usernameCursor, setUsernameCursor] = useState(0)
  const [mobile, setMobile] = useState('')
  const [mobileCursor, setMobileCursor] = useState(0)
  const [creditCode, setCreditCode] = useState('')
  const [creditCodeCursor, setCreditCodeCursor] = useState(0)
  const [idCard, setIdCard] = useState('')
  const [idCardCursor, setIdCardCursor] = useState(0)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordCursor, setNewPasswordCursor] = useState(0)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordCursor, setConfirmPasswordCursor] = useState(0)
  const [supportContacts, setSupportContacts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getContactSettings()
      .then((res) => {
        if (res.data?.code === 200) {
          setSupportContacts(normalizeSupportContacts(res.data?.data))
        }
      })
      .catch(() => {})
  }, [])

  const syncInput = (setValue, setCursor) => (value, event) => {
    const nextValue = String(value ?? '')
    setValue(nextValue)
    setCursor(event?.detail?.cursor ?? nextValue.length)
  }

  const handleManualHelp = () => {
    presentSupportContacts(supportContacts, {
      emptyMessage: '暂未配置客服电话，如需人工协助，请联系平台运营人员',
      singleTitle: '人工协助重置',
      singleDescription: '请准备登录名、统一社会信用代码、注册手机号和身份证号后再拨打。',
      multiTitle: '请选择要联系的客服',
    })
  }

  const handleSubmit = () => {
    if (!username || !mobile || !creditCode || !idCard || !newPassword || !confirmPassword) {
      Taro.showToast({ title: '请完整填写找回信息', icon: 'none' })
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
    if (!/^\d{17}[\dXx]$/.test(idCard)) {
      Taro.showToast({ title: '请输入18位身份证号', icon: 'none' })
      return
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      Taro.showToast({ title: '密码长度需在6-128位之间', icon: 'none' })
      return
    }
    if (newPassword !== confirmPassword) {
      Taro.showToast({ title: '两次输入的密码不一致', icon: 'none' })
      return
    }

    setLoading(true)
    api.forgotPasswordReset({
      username,
      mobile,
      creditCode: creditCode.toUpperCase(),
      idCard: idCard.toUpperCase(),
      newPassword,
    })
      .then((res) => {
        if (res.data?.code === 200) {
          Taro.showToast({ title: '密码已重置，请重新登录', icon: 'success' })
          setTimeout(() => Taro.redirectTo({ url: '/pages/login/index' }), 800)
          return
        }
        Taro.showToast({ title: res.data?.message || '重置失败', icon: 'none' })
      })
      .catch(() => Taro.showToast({ title: '重置失败', icon: 'none' }))
      .finally(() => setLoading(false))
  }

  return (
    <View className="page page--secondary auth-page forgot-password-page">
      <TopBar title="忘记密码" showBack variant="secondary" />
      <View className="secondary-page__body auth-page__body forgot-password-page__body">
        <View className="secondary-card form-card auth-page__card auth-page__card--primary forgot-password-page__card">
          <View className="forgot-password-page__head">
            <View className="auth-page__section forgot-password-page__intro">
              <Text className="auth-page__title">自助重置密码</Text>
              <Text className="auth-page__desc">
                一次性填写注册资料完成身份校验。若不方便自助操作，可使用人工协助入口联系运营人员。
              </Text>
            </View>
            <Text className="forgot-password-page__manual-trigger" onClick={handleManualHelp}>
              人工协助
            </Text>
          </View>

          <View className="auth-form forgot-password-page__form">
            <View className="auth-form__field">
              <Text className="auth-form__label">
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
            <View className="auth-form__field">
              <Text className="auth-form__label">
                <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                注册手机号
              </Text>
              <AtInput
                name="mobile"
                type="phone"
                placeholder="请输入注册手机号"
                value={mobile}
                cursor={mobileCursor}
                onChange={syncInput(setMobile, setMobileCursor)}
              />
            </View>
            <View className="auth-form__field">
              <Text className="auth-form__label">
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
            <View className="auth-form__field">
              <Text className="auth-form__label">
                <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                注册人身份证号
              </Text>
              <AtInput
                name="idCard"
                placeholder="请输入18位身份证号"
                value={idCard}
                cursor={idCardCursor}
                onChange={syncInput(setIdCard, setIdCardCursor)}
                maxLength={18}
              />
            </View>
            <View className="auth-form__field">
              <Text className="auth-form__label">
                <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                新密码
              </Text>
              <AtInput
                name="newPassword"
                type="password"
                placeholder="请输入新密码"
                value={newPassword}
                cursor={newPasswordCursor}
                onChange={syncInput(setNewPassword, setNewPasswordCursor)}
              />
            </View>
            <View className="auth-form__field">
              <Text className="auth-form__label">
                <Text className="auth-form__required">{REQUIRED_MARK}</Text>
                确认新密码
              </Text>
              <AtInput
                name="confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                value={confirmPassword}
                cursor={confirmPasswordCursor}
                onChange={syncInput(setConfirmPassword, setConfirmPasswordCursor)}
              />
            </View>
            <AtButton type="primary" full onClick={handleSubmit} loading={loading}>
              验证并重置密码
            </AtButton>
          </View>
        </View>
      </View>
    </View>
  )
}
