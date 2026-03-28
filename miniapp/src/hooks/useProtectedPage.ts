import { useEffect, useRef, useState } from 'react'
import { useDidShow } from '@tarojs/taro'
import { hasAuthToken, routeGuestToLogin } from '../utils/auth'

export function useProtectedPage(message = '请先登录后查看详情') {
  const [authorized, setAuthorized] = useState(() => hasAuthToken())
  const redirectingRef = useRef(false)

  const guardAccess = () => {
    const allowed = hasAuthToken()
    setAuthorized(allowed)

    if (!allowed && !redirectingRef.current) {
      redirectingRef.current = true
      routeGuestToLogin(message)
      return false
    }

    if (allowed) {
      redirectingRef.current = false
    }

    return allowed
  }

  useEffect(() => {
    guardAccess()
  }, [])

  useDidShow(() => {
    guardAccess()
  })

  return authorized
}
