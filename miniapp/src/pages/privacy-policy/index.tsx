import { ScrollView, View, Text } from '@tarojs/components'
import TopBar from '../../components/TopBar'
import './index.scss'

const SECTIONS = [
  {
    title: '一、收集的信息',
    content:
      '为完成企业注册、登录、找回密码、审核查询和客服协助等功能，我们可能收集登录名、手机号、身份证号、统一社会信用代码、企业联系人信息以及必要的操作记录。',
  },
  {
    title: '二、使用目的',
    content:
      '上述信息主要用于账号认证、企业主体核验、密码重置、审核处理、服务通知和运营支持，不会超出完成相关功能所必需的范围使用。',
  },
  {
    title: '三、存储与保护',
    content:
      '我们会采取合理的技术和管理措施保护用户信息安全。身份证号等敏感信息将按系统设计进行必要处理，不以明文形式在前端页面回显。',
  },
  {
    title: '四、共享与披露',
    content:
      '除法律法规要求或为完成用户明确申请的业务流程外，我们不会向无关第三方提供用户个人信息。涉及人工协助重置密码时，仅限授权运营人员在业务范围内使用。',
  },
  {
    title: '五、用户权利',
    content:
      '如需申请人工协助、修改资料或处理账号问题，可通过小程序中展示的客服联系方式联系平台运营人员。',
  },
]

export default function PrivacyPolicyPage() {
  return (
    <View className="page page--secondary legal-page">
      <TopBar title="隐私政策" showBack variant="secondary" />
      <ScrollView scrollY className="legal-page__scroll">
        <View className="secondary-card legal-page__card">
          <Text className="legal-page__title">金堂招讯通隐私政策</Text>
          <Text className="legal-page__intro">
            我们重视用户隐私保护，并仅在实现账号和企业服务功能所需的范围内处理相关信息。
          </Text>
          {SECTIONS.map((section) => (
            <View key={section.title} className="legal-page__section">
              <Text className="legal-page__section-title">{section.title}</Text>
              <Text className="legal-page__section-text">{section.content}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
