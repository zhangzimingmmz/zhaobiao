import Taro from '@tarojs/taro'

export function normalizeSupportContacts(data) {
  if (Array.isArray(data?.supportContacts) && data.supportContacts.length > 0) {
    return data.supportContacts
      .map((item) => ({
        name: String(item?.name || '').trim(),
        phone: String(item?.phone || '').trim(),
      }))
      .filter((item) => item.name && item.phone)
  }

  const phone = String(data?.supportPhone || '').trim()
  if (!phone) return []
  return [{ name: '客服电话', phone }]
}

export function presentSupportContacts(contacts, options = {}) {
  const {
    emptyMessage = '暂未配置客服电话',
    singleTitle = '联系客服',
    singleDescription = '',
    multiTitle = '请选择客服',
  } = options

  if (!Array.isArray(contacts) || contacts.length === 0) {
    Taro.showToast({ title: emptyMessage, icon: 'none' })
    return
  }

  if (contacts.length === 1) {
    const contact = contacts[0]
    const content = singleDescription
      ? `${contact.name}：${contact.phone}\n${singleDescription}`
      : `${contact.name}：${contact.phone}`

    Taro.showModal({
      title: singleTitle,
      content,
      confirmText: '拨打',
      cancelText: '关闭',
      success: (result) => {
        if (result.confirm) {
          Taro.makePhoneCall({ phoneNumber: contact.phone.replace(/\s+/g, '') })
        }
      },
    })
    return
  }

  Taro.showActionSheet({
    alertText: multiTitle,
    itemList: contacts.map((item) => `${item.name} ${item.phone}`),
    success: (result) => {
      const selected = contacts[result.tapIndex]
      if (!selected) return
      Taro.makePhoneCall({ phoneNumber: selected.phone.replace(/\s+/g, '') })
    },
    fail: (err) => {
      const errMsg = String(err?.errMsg || '')
      if (errMsg.includes('cancel')) return
      Taro.showToast({ title: '客服列表打开失败，请稍后重试', icon: 'none' })
    },
  })
}
