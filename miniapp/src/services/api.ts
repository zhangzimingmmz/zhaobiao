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
  /** 根据 token 获取当前用户账号与审核状态，需已登录 */
  me() {
    return get('/api/auth/me')
  },
  // 文章相关接口
  getArticles(params) {
    return get('/api/articles', params)
  },
  getArticle(id) {
    return get(`/api/articles/${id}`)
  },
  recordArticleView(id) {
    return post(`/api/articles/${id}/view`, {})
  },
  getFavorites(params) {
    return get('/api/favorites', params)
  },
  toggleFavorite(data) {
    return post('/api/favorites/toggle', data)
  },
}
