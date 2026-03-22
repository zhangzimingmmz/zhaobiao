# 项目架构与需求清单 PRD

## 1. 文档目的

本文档用于从产品和系统视角梳理当前项目的整体架构、系统边界与核心需求，作为后续需求讨论、功能排期、接口对齐和管理端/小程序协作的统一参考。

本文档基于当前仓库中的实际代码、接口、OpenSpec 变更和现有说明文档整理，重点描述已经明确存在或已经纳入系统设计范围的能力。

当前推荐优先阅读的正式文档入口如下：

- 项目总览：本文档
- 前台接口：[接口文档-前端与小程序.md](./接口文档-前端与小程序.md)
- 后台接口：[后台管理接口文档.md](./后台管理接口文档.md)
- 后台需求：[统一运营后台需求清单.md](./统一运营后台需求清单.md)
- 数据源接口：[原始数据接口文档.md](./原始数据接口文档.md)
- 数据库设计：[数据库表设计.md](./数据库表设计.md)
- 联调指南：[开发联调指南.md](./开发联调指南.md)

---

## 2. 项目整体架构

当前项目由四个正式系统构成：

1. 爬虫采集系统
2. 统一后端服务
3. 微信小程序
4. 运营后台前端

整体关系如下：

```text
外部公告站点(site1/site2)
          |
          v
   爬虫采集系统(crawler)
          |
          v
 SQLite 数据库(notices.db)
          |
          v
 统一后端服务(server/FastAPI)
      |
      v
 微信小程序(miniapp)
      |
      v
 运营后台前端(admin-frontend)
```

### 2.1 架构说明

| 层级 | 系统 | 作用 |
|------|------|------|
| 数据源层 | site1 / site2 外部网站 | 提供原始招投标、政府采购、采购意向等公告数据 |
| 数据采集层 | crawler | 负责按任务抓取数据、清洗、对账、回填、增量更新并写入统一库 |
| 数据存储层 | SQLite `notices.db` | 存储公告主表、字典表、用户表、企业认证申请、采集运行记录 |
| 服务层 | server | 对外提供统一 API，包括公告查询、认证、审核、管理端控制面 |
| 用户端 | miniapp | 面向客户/业务用户，负责公告展示、登录、认证、收藏等 |
| 管理端 | admin-frontend | 面向单运营人员，负责后台登录、总览、企业审核、企业目录、采集控制、运行记录 |
| 管理能力 | server 管理接口 | 向后台前端提供企业审核、企业目录与采集控制能力 |

---

## 3. 系统边界与定位

| 系统 | 定位 | 主要用户 |
|------|------|----------|
| 爬虫采集系统 | 采集外部网站公告并维护数据完整性 | 开发、运维、管理员 |
| 统一后端服务 | 提供统一业务 API 和管理接口 | 小程序、运营后台前端 |
| 微信小程序 | 面向客户的信息展示和认证入口 | 普通用户、企业用户 |
| 运营后台前端 | 面向内部运营的极简后台 | 单运营人员 |

说明：仓库中的 `ui` 样例工程已退役，不再作为正式系统组成部分。当前正式 Web 管理后台前端为 `admin-frontend/`，并通过 `server` 中的 `/api/admin/*` 接口工作。

---

## 4. 正式需求清单

以下按“系统-功能-页面/API-优先级”整理。

### 4.1 爬虫采集系统

| 系统 | 功能 | 页面/API/任务入口 | 优先级 |
|------|------|-------------------|--------|
| 爬虫采集系统 | 站点一增量采集 | `crawler.site1.tasks.incremental` | P0 |
| 爬虫采集系统 | 站点一补偿采集 | `crawler.site1.tasks.recovery` | P0 |
| 爬虫采集系统 | 站点一按时间范围回填 | `crawler.site1.tasks.backfill` | P0 |
| 爬虫采集系统 | 站点二增量采集 | `crawler.site2.tasks.incremental` | P0 |
| 爬虫采集系统 | 站点二补偿采集 | `crawler.site2.tasks.recovery` | P0 |
| 爬虫采集系统 | 站点二按时间范围回填 | `crawler.site2.tasks.backfill` | P0 |
| 爬虫采集系统 | 站点二采集前预检查 | `crawler.site2.tasks.precheck` | P1 |
| 爬虫采集系统 | 站点二源站与库内数据对账 | `crawler.site2.tasks.reconcile` | P0 |
| 爬虫采集系统 | 统一公告落库与 `(site, id)` 去重 | `notices` 表、`crawler/storage.py` | P0 |
| 爬虫采集系统 | 公告字段标准化映射 | `notices` 表字段、落库映射逻辑 | P0 |
| 爬虫采集系统 | 采集运行日志记录 | `logs/`、`logs/admin-crawl/` | P1 |
| 爬虫采集系统 | 采集任务审计与状态记录 | `crawl_runs` 相关记录、控制面 run lifecycle | P0 |
| 爬虫采集系统 | 危险动作隔离，不允许后台直接执行 | `cleanup`、`--formal` 等动作拒绝 | P0 |

### 4.2 统一后端服务

| 系统 | 功能 | 页面/API | 优先级 |
|------|------|----------|--------|
| 统一后端服务 | 公告列表查询 | `GET /api/list` | P0 |
| 统一后端服务 | 招投标详情查询 | `GET /api/detail/bid/{id}` | P0 |
| 统一后端服务 | 信息展示详情查询 | `GET /api/detail/info/{id}` | P0 |
| 统一后端服务 | 公告分类字典查询 | `GET /api/dict/categories` | P1 |
| 统一后端服务 | 地区字典查询 | `GET /api/dict/regions` | P1 |
| 统一后端服务 | 采购方式字典查询 | `GET /api/dict/purchase-manner` | P1 |
| 统一后端服务 | 获取验证码 | `GET /api/auth/captcha` | P0 |
| 统一后端服务 | 手机号验证码登录 | `POST /api/auth/login` | P0 |
| 统一后端服务 | 企业认证提交 | `POST /api/auth/register` | P0 |
| 统一后端服务 | 企业认证审核状态查询 | `GET /api/auth/audit-status` | P0 |
| 统一后端服务 | 管理员查看审核申请列表 | `GET /api/admin/reviews` | P0 |
| 统一后端服务 | 管理员查看审核详情 | `GET /api/admin/reviews/{application_id}` | P0 |
| 统一后端服务 | 管理员审核通过 | `POST /api/admin/reviews/{application_id}/approve` | P0 |
| 统一后端服务 | 管理员审核驳回 | `POST /api/admin/reviews/{application_id}/reject` | P0 |
| 统一后端服务 | 企业目录查询 | `GET /api/admin/companies` | P1 |
| 统一后端服务 | 获取可执行采集动作列表 | `GET /api/admin/crawl/actions` | P0 |
| 统一后端服务 | 查询采集运行记录 | `GET /api/admin/crawl/runs` | P0 |
| 统一后端服务 | 查询单次采集运行详情 | `GET /api/admin/crawl/runs/{run_id}` | P1 |
| 统一后端服务 | 提交受控采集请求 | `POST /api/admin/crawl/runs` | P0 |
| 统一后端服务 | 管理员鉴权 | Bearer `ADMIN_TOKEN` | P0 |
| 统一后端服务 | 用户鉴权 | Bearer token | P0 |

### 4.3 微信小程序

| 系统 | 功能 | 页面/API | 优先级 |
|------|------|----------|--------|
| 微信小程序 | 首页公告浏览 | `pages/index/index` | P0 |
| 微信小程序 | 一级频道切换（工程建设/政府采购/信息展示） | `pages/index/index` | P0 |
| 微信小程序 | 二级分类切换 | `pages/index/index` | P0 |
| 微信小程序 | 招标计划/招标公告/采购公告/采购意向公开切换 | `pages/index/index` | P0 |
| 微信小程序 | 多维筛选（时间、地区、来源、采购方式、项目分类、采购人） | `pages/index/index` + `GET /api/list` | P0 |
| 微信小程序 | 关键词搜索 | `pages/index/index` + `GET /api/list` | P0 |
| 微信小程序 | 列表分页加载更多 | `pages/index/index` + `GET /api/list` | P0 |
| 微信小程序 | 招投标详情页 | `pages/detail/index` + `GET /api/detail/bid/{id}` | P0 |
| 微信小程序 | 信息展示详情页 | `pages/info-detail/index` + `GET /api/detail/info/{id}` | P0 |
| 微信小程序 | 查看原文 | `pages/webview/index` | P1 |
| 微信小程序 | 收藏/取消收藏 | `pages/detail/index`、本地收藏逻辑 | P1 |
| 微信小程序 | 收藏列表 | `pages/favorites/index` | P1 |
| 微信小程序 | 手机号验证码登录 | `pages/login/index` + 认证接口 | P0 |
| 微信小程序 | 登录后按认证状态自动分流 | `pages/login/index` + `GET /api/auth/audit-status` | P0 |
| 微信小程序 | 企业认证表单提交 | `pages/register/index` + `POST /api/auth/register` | P0 |
| 微信小程序 | 审核状态查看 | `pages/audit-status/index` + `GET /api/auth/audit-status` | P0 |
| 微信小程序 | 我的页面查看认证状态与下一步动作 | `pages/profile/index` + `GET /api/auth/audit-status` | P0 |
| 微信小程序 | 退出登录 | `pages/profile/index` | P1 |

### 4.4 管理能力（当前保留为服务端接口）

| 系统 | 功能 | 页面/API | 优先级 |
|------|------|----------|--------|
| 统一后端服务 | 企业认证审核列表 | `GET /api/admin/reviews` | P0 |
| 统一后端服务 | 查看企业认证详情 | `GET /api/admin/reviews/{application_id}` | P0 |
| 统一后端服务 | 审核通过 | `POST /api/admin/reviews/{application_id}/approve` | P0 |
| 统一后端服务 | 审核驳回并填写原因 | `POST /api/admin/reviews/{application_id}/reject` | P0 |
| 统一后端服务 | 企业目录查询 | `GET /api/admin/companies` | P1 |
| 统一后端服务 | 查看受支持采集动作 | `GET /api/admin/crawl/actions` | P0 |
| 统一后端服务 | 提交手工采集任务 | `POST /api/admin/crawl/runs` | P0 |
| 统一后端服务 | 查看采集运行历史 | `GET /api/admin/crawl/runs` | P0 |
| 统一后端服务 | 查看单次采集运行详情 | `GET /api/admin/crawl/runs/{run_id}` | P1 |

---

## 5. 业务优先级说明

### 5.1 P0 核心能力

P0 表示当前系统成立所必须具备的能力，缺失会直接影响业务闭环：

- 公告采集、回填、增量、补偿、对账
- 公告列表与详情查询
- 手机号登录与企业认证
- 企业认证审核闭环
- 后台可受控触发采集任务
- 小程序首页、详情、认证状态流

### 5.2 P1 重要但非阻断能力

P1 表示提升可用性、管理效率或体验，但不构成第一优先级闭环阻断：

- 字典查询接口
- 企业目录增强展示
- 预检查与日志可视化
- 查看原文
- 收藏能力
- 更丰富的后台筛选和详情展示

---

## 6. 主要页面与系统映射

| 页面/入口 | 所属系统 | 目标 |
|-----------|----------|------|
| 小程序首页 `pages/index/index` | 微信小程序 | 公告浏览、筛选、搜索、分流 |
| 小程序详情页 `pages/detail/index` | 微信小程序 | 查看招投标正文和关键信息 |
| 小程序信息详情页 `pages/info-detail/index` | 微信小程序 | 查看信息展示正文 |
| 小程序登录页 `pages/login/index` | 微信小程序 | 完成登录并引导认证 |
| 小程序认证页 `pages/register/index` | 微信小程序 | 提交企业认证资料 |
| 小程序审核状态页 `pages/audit-status/index` | 微信小程序 | 查看认证审核结果 |
| 小程序我的页 `pages/profile/index` | 微信小程序 | 查看账号状态、认证信息、退出登录 |
| 小程序收藏页 `pages/favorites/index` | 微信小程序 | 查看已收藏内容 |
| 管理接口 `GET /api/admin/reviews` | 统一后端服务 | 管理员查看企业认证申请列表 |
| 管理接口 `GET /api/admin/companies` | 统一后端服务 | 管理员查看企业当前有效状态 |
| 管理接口 `GET /api/admin/crawl/actions` | 统一后端服务 | 获取受支持的采集动作 |
| 管理接口 `GET /api/admin/crawl/runs` | 统一后端服务 | 查看采集运行历史 |

---

## 7. 当前明确存在的产品约束

| 约束项 | 说明 |
|--------|------|
| 后台采集控制仅允许白名单动作 | 不允许任意模块执行，也不允许危险脚本直接从后台触发 |
| 同一站点存在排他保护 | 某站点有运行中的后台任务时，额外请求会被拒绝 |
| 收藏能力当前主要是本地收藏 | 暂未形成稳定的后端同步收藏闭环 |
| 管理员认证较轻量 | 当前以 `ADMIN_TOKEN` 为主，尚未形成完整管理员账号体系 |
| 数据统一落在单表 | 所有公告统一进入 `notices` 表，通过字段映射支持多来源、多类型 |

---

## 8. 后续可扩展需求建议

以下能力当前未作为核心闭环的一部分，但后续有较高演进价值：

| 系统 | 功能方向 | 建议优先级 |
|------|----------|------------|
| 微信小程序 | 收藏云同步 | P2 |
| 微信小程序 | 用户消息提醒/审核结果通知 | P2 |
| 管理能力 | 正式 Web 管理后台前端 | P1 |
| 管理能力 | 管理员登录与角色权限体系 | P1 |
| 管理能力 | 数据看板、采集统计报表 | P2 |
| 统一后端服务 | 收藏接口正式化 | P2 |
| 爬虫采集系统 | 更细粒度任务调度与取消机制 | P2 |
| 爬虫采集系统 | 分布式 worker / 独立 dispatcher | P3 |

---

## 9. 结论

当前项目已经形成了一个较完整的业务闭环：

- 爬虫系统负责把外部公告稳定采集进统一库
- 后端服务负责向用户端提供业务接口，并向管理员保留管理接口
- 小程序负责客户浏览、登录、企业认证和收藏
- 管理能力当前以服务端接口形式存在，正式 Web 后台前端仍待单独立项

如果从产品视角总结，当前项目的核心业务目标可以概括为：

**为招投标/政府采购信息提供一个“可持续采集、可统一查询、可认证管理、可后台运营”的完整平台。**
