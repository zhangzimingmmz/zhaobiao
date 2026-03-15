/**
 * 接口封装，与 docs/接口文档-前端与小程序.md 一致
 */
import { get, post } from './request'

export const api = {
  list(params) {
    return get('/api/list', params)
  },
  detailBid(id) {
    return get(`/api/detail/bid/${id}`)
  },
  detailInfo(id) {
    return get(`/api/detail/info/${id}`)
  },
  login(data) {
    return post('/api/auth/login', data)
  },
  register(data) {
    return post('/api/auth/register', data)
  },
  auditStatus(params) {
    return get('/api/auth/audit-status', params)
  },
}
