/**
 * 运行时常量，与 docs/接口文档-前端与小程序.md 约定一致。
 * 修改 baseUrl 后重新编译即可；正式环境可改为从 Taro 环境变量读取。
 *
 * 开发联调时将 baseUrl 改为本地公告 API 地址：
 *   开发：http://localhost:8000
 *   生产：https://api.example.com
 *
 * 本地启动 API 服务：
 *   cd <项目根>
 *   NOTICES_DB=data/notices.db uvicorn server.main:app --reload --port 8000
 */
export const config = {
  baseUrl: 'http://localhost:8000',
}
