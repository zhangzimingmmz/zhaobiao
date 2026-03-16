## Why

运营人员需要在小程序「信息展示」板块发布单位动态、政策法规等图文信息。当前系统只展示爬虫采集的数据,无法人工编辑发布内容。需要提供内容管理能力,让运营人员能够复用公众号文章,快速发布到小程序,降低内容生产成本。

## What Changes

- 新增 articles 数据表,存储人工编辑的文章元数据(标题、摘要、封面图、公众号文章链接)
- 新增运营后台文章管理模块,支持创建、编辑、发布、下线、删除文章
- 新增后端 API 接口,包括运营端 CRUD 接口和小程序端查询接口
- 新增小程序 web-view 页面,用于展示公众号文章完整内容
- 改造小程序「信息展示」tab,从展示爬虫数据改为展示人工编辑的文章列表
- 实现自动校验和提取公众号文章信息,减少人工录入错误
- 实现操作日志记录,追溯文章创建、发布、修改等操作

## Capabilities

### New Capabilities
- `article-management`: 文章内容管理能力,包括文章 CRUD、状态流转、自动校验、操作审计
- `wechat-article-integration`: 公众号文章集成能力,包括链接校验、信息提取、重复检查
- `miniapp-article-display`: 小程序文章展示能力,包括列表展示、详情跳转、web-view 加载

### Modified Capabilities
<!-- 无现有能力需要修改 -->

## Impact

- **后端 (server/)**: 新增 articles 表迁移脚本、新增文章管理 API 接口、新增 Pydantic 模型
- **运营后台 (admin-frontend/)**: 新增内容管理菜单、新增文章列表页、新增文章编辑器页面
- **小程序 (miniapp/)**: 改造信息展示 tab、新增 web-view 页面、新增文章 API 调用
- **数据库**: 新增 articles 表和 article_operation_logs 表
- **依赖**: 可能需要 requests、beautifulsoup4 用于提取公众号文章信息
