# 04-API文档

> **作用**：给人提供「接口业务视角」的入口，不替代 OpenAPI。  
> **给谁看**：前端、后端、测试、集成方、新人。  
> **什么时候改**：新增/删除接口、接口分组或职责、鉴权、错误码策略或 API 版本变化时。  
> **谁改**：改接口的人先改。  
> **是否 review**：需要；接口变更应是 PR review 重点。

---

## 1. 接口分组

| 分组 | 职责 | 鉴权 |
|------|------|------|
| 公告列表与详情 | 列表分页筛选、招投标详情、信息展示详情 | 部分公开；详情可带 token 用于收藏等 |
| 认证与用户 | 验证码、登录、注册（企业认证）、审核状态查询 | 登录/注册后部分接口需 Bearer token |
| 收藏 | 收藏/取消收藏、收藏列表 | 需登录 |
| 字典 | 地区、采购方式、分类等 | 一般公开 |
| 管理端 | 企业审核、企业目录、采集动作列表、采集运行记录、提交 run、文章管理 | 需管理员 token（如 Authorization: Bearer <ADMIN_TOKEN>） |
| 文章 | 小程序获取已发布文章列表、详情、记录浏览 | 公开 |

---

## 2. 关键接口清单

- **GET /api/list**：公告列表，必填 page、pageSize、category；可选 keyword、timeStart、timeEnd、regionCode、source、purchaseManner 等。当前 notices 只保留最近 30 天数据，超出保留窗口的历史采集公告不会再出现在列表中。
- **GET /api/detail/bid/:id**：招投标详情；`content` 为后端按来源站点格式化后的可渲染正文。对 site1，当详情页已补抓成功时优先返回详情页 HTML 正文而非列表压平文本。若某条 notices 已因 30 天 retention 被删除，详情接口将返回未找到。
- **GET /api/detail/info/:id**：信息展示详情；`content` 为后端按来源站点格式化后的可渲染正文。
- **GET /api/auth/captcha**：获取验证码。
- **POST /api/auth/login**：手机号+验证码登录，返回 JWT。
- **POST /api/auth/register**：企业认证提交。
- **GET /api/auth/audit-status**：当前用户审核状态。
- **GET /api/favorites**：当前登录用户收藏列表，只返回仍可解析的源数据。若某条 `bid` notices 因 30 天 retention 被清理，其关联 favorites 会同步删除。
- **POST /api/favorites/toggle**：切换登录用户的收藏状态；`bid` 需传 `targetSite`。
- **GET /api/admin/crawl/actions**：可执行的采集动作列表。
- **GET /api/admin/crawl/runs**：采集运行记录。
- **POST /api/admin/crawl/runs**：提交采集 run（参数见接口）。
- **GET /api/articles**：小程序获取已发布文章列表，支持分页、分类筛选。
- **GET /api/articles/:id**：文章详情。
- **POST /api/articles/:id/view**：记录文章浏览（可选）。

---

## 3. 鉴权方式

- **用户端**：登录后响应中带 JWT；请求时头 `Authorization: Bearer <token>`。
- **收藏真值**：列表、详情、文章接口在带有效 token 时返回 `favorited`，收藏页通过 `GET /api/favorites` 读取账号级收藏。
- **管理端**：使用固定管理员 token，头 `Authorization: Bearer <ADMIN_TOKEN>`。
- **业务码**：HTTP 200 时，业务成功与否看 body 中 `code`（如 200 成功、401 未登录、403 无权限）或 `success`；错误信息在 `message` / `msg`。

---

## 4. 版本与错误码

- 当前无多版本路径；变更尽量兼容，破坏性变更需在 changelog 或 release 说明。
- 错误码以后端实际返回为准，常见：400 参数错误、401 未登录/ token 无效、403 无权限、404 资源不存在。

---

## 5. 精确契约与调用链

- **精确路径、请求/响应 schema**：以 FastAPI 生成的 **OpenAPI** 为准，本地运行后访问 `http://localhost:8000/docs` 或 `GET /openapi.json`；可导出为 `api/openapi.yaml` 供离线使用。
- **前端与小程序契约**：历史详细描述见 [接口文档-前端与小程序.md](./接口文档-前端与小程序.md)。
- **管理端接口**：见 [后台管理接口文档.md](./后台管理接口文档.md)。
