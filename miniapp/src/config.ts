/**
 * 运行时常量，与 docs/接口文档-前端与小程序.md 约定一致。
 * 优先从 Taro 构建期环境变量读取，未配置时默认走远程 API 地址。
 *
 * 默认：https://api-zhaobiao.zhangziming.cn
 * 本地联调：http://localhost:8000
 *
 * 本地启动 API 服务：
 *   cd <项目根>
 *   NOTICES_DB=data/notices.db uvicorn server.main:app --reload --port 8000
 */
const envBaseUrl = process.env.TARO_APP_API_BASE

export const config = {
  baseUrl: envBaseUrl || 'https://api-zhaobiao.zhangziming.cn',
}
