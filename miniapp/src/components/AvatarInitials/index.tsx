import { View, Text } from '@tarojs/components'
import './index.scss'

const BG_COLORS = [
  '#E6F4FF', // $color-primary-bg
  '#E6F7ED', // $color-success-bg
  '#FFF7E6', // $color-warning-bg
  '#FFF1F0', // $color-error-bg
  '#E6F4FF', // primary variant
  '#E6F7ED', // success variant
]

function getInitial(name, username, mobile) {
  if (name && String(name).trim()) return String(name).trim().charAt(0)
  if (username && String(username).trim()) return String(username).trim().charAt(0)
  if (mobile && String(mobile).trim()) return String(mobile).trim().slice(-1)
  return '?'
}

function getBgColor(userId, username) {
  const seed = (userId || username || '') + ''
  let sum = 0
  for (let i = 0; i < seed.length; i++) sum += seed.charCodeAt(i)
  return BG_COLORS[Math.abs(sum) % BG_COLORS.length]
}

export default function AvatarInitials({ name, userId, username, mobile, size = 88 }) {
  const initial = getInitial(name, username, mobile)
  const bgColor = getBgColor(userId, username)

  return (
    <View
      className="avatar-initials"
      style={{
        width: `${size}rpx`,
        height: `${size}rpx`,
        borderRadius: `${size / 2}rpx`,
        backgroundColor: bgColor,
        fontSize: `${size * 0.45}rpx`,
      }}
    >
      <Text className="avatar-initials__text">{initial}</Text>
    </View>
  )
}
