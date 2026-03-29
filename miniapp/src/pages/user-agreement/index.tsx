import { ScrollView, View, Text } from '@tarojs/components'
import TopBar from '../../components/TopBar'
import './index.scss'

const SECTIONS = [
  {
    title: '一、服务说明',
    content:
      '本小程序用于展示招投标与政府采购相关信息，并为企业用户提供注册、登录、收藏、资料提交和审核状态查询等服务。用户应确保所填写资料真实、合法、有效。',
  },
  {
    title: '二、账号使用',
    content:
      '企业账号由注册人代表企业申请使用。用户应妥善保管登录名和密码，不得转让、出租、出借账号，不得以任何方式干扰平台正常运行。',
  },
  {
    title: '三、资料提交与审核',
    content:
      '企业注册、资料修改、找回密码等功能均基于用户提交的信息进行处理。若资料存在虚假、冒用或其他不合规情形，平台有权拒绝服务或暂停账号使用。',
  },
  {
    title: '四、信息使用限制',
    content:
      '平台展示的公告、文章、附件和外部链接仅供信息参考。用户在使用相关信息时，应自行判断内容准确性并遵守原始来源网站的使用规范。',
  },
  {
    title: '五、责任说明',
    content:
      '因网络故障、第三方服务异常、源站内容变更或不可抗力导致的服务中断、链接失效或数据延迟，平台将尽力修复，但不对由此产生的间接损失承担责任。',
  },
]

export default function UserAgreementPage() {
  return (
    <View className="page page--secondary legal-page">
      <TopBar title="用户协议" showBack variant="secondary" />
      <ScrollView scrollY className="legal-page__scroll">
        <View className="secondary-card legal-page__card">
          <Text className="legal-page__title">金堂招讯通用户协议</Text>
          <Text className="legal-page__intro">
            请在使用注册、登录、找回密码和企业资料提交功能前，认真阅读本协议。
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
