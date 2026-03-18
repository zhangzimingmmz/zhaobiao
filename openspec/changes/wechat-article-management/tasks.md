## 1. 数据库设计与迁移

- [x] 1.1 创建 articles 表迁移脚本 (crawler/migrations/001_create_articles_table.sql)
- [x] 1.2 创建 article_operation_logs 表迁移脚本
- [x] 1.3 添加必要的索引 (status+publish_time, category, wechat_article_url 唯一索引)
- [x] 1.4 在 server/main.py 的 _init_db 函数中添加表初始化逻辑
- [x] 1.5 测试迁移脚本的幂等性

## 2. 后端 Pydantic 模型定义

- [x] 2.1 创建 server/models.py 文件
- [x] 2.2 定义 ArticleCreate 模型 (包含字段校验)
- [x] 2.3 定义 ArticleUpdate 模型
- [x] 2.4 定义 ArticleResponse 模型
- [x] 2.5 添加 wechatArticleUrl 格式校验器
- [x] 2.6 添加 category 枚举值校验器

## 3. 后端公众号文章信息提取

- [x] 3.1 安装依赖 requests 和 beautifulsoup4
- [x] 3.2 实现 extract_article_info 函数 (提取标题、封面图、摘要)
- [x] 3.3 实现 POST /api/admin/articles/validate-url 接口
- [x] 3.4 实现 POST /api/admin/articles/check-duplicate 接口
- [x] 3.5 添加超时和异常处理
- [x] 3.6 测试提取功能 (使用真实公众号链接)

## 4. 后端文章管理 API (运营端)

- [x] 4.1 实现 POST /api/admin/articles (创建文章)
- [x] 4.2 实现 GET /api/admin/articles (文章列表,支持分页、筛选、搜索)
- [x] 4.3 实现 GET /api/admin/articles/:id (文章详情)
- [x] 4.4 实现 PUT /api/admin/articles/:id (更新文章)
- [x] 4.5 实现 POST /api/admin/articles/:id/publish (发布文章)
- [x] 4.6 实现 POST /api/admin/articles/:id/unpublish (下线文章)
- [x] 4.7 实现 DELETE /api/admin/articles/:id (删除文章)
- [x] 4.8 添加管理员权限校验 (Depends(get_admin_user))

## 5. 后端操作日志记录

- [x] 5.1 实现 log_article_operation 函数
- [x] 5.2 在创建文章时记录日志
- [x] 5.3 在更新文章时记录日志
- [x] 5.4 在发布文章时记录日志
- [x] 5.5 在下线文章时记录日志
- [x] 5.6 在删除文章时记录日志
- [x] 5.7 实现 GET /api/admin/articles/:id/logs (查询操作历史)

## 6. 后端小程序端 API

- [x] 6.1 实现 GET /api/articles (已发布文章列表,支持分页、分类筛选)
- [x] 6.2 实现 GET /api/articles/:id (文章详情,只返回已发布文章)
- [x] 6.3 实现 POST /api/articles/:id/view (记录文章浏览,可选)
- [x] 6.4 确保接口只返回 status=published 的文章

## 7. 后端接口测试

- [x] 7.1 使用 FastAPI Swagger UI 测试所有运营端接口
- [x] 7.2 使用 FastAPI Swagger UI 测试所有小程序端接口
- [x] 7.3 测试字段校验 (空标题、无效链接等)
- [x] 7.4 测试重复文章检查
- [x] 7.5 测试状态流转 (draft → published → unpublished)
- [x] 7.6 测试操作日志记录

## 8. 运营后台 - 路由与菜单

- [x] 8.1 在 admin-frontend/src/App.tsx 添加文章管理路由
- [x] 8.2 在侧边栏添加"内容管理"菜单项
- [x] 8.3 创建 admin-frontend/src/pages/ArticlesPage.tsx
- [x] 8.4 创建 admin-frontend/src/pages/ArticleEditorPage.tsx

## 9. 运营后台 - API 封装

- [x] 9.1 在 admin-frontend/src/lib/api.ts 添加文章相关 API 方法
- [x] 9.2 实现 createArticle 方法
- [x] 9.3 实现 getAdminArticles 方法
- [x] 9.4 实现 getArticle 方法
- [x] 9.5 实现 updateArticle 方法
- [x] 9.6 实现 publishArticle 方法
- [x] 9.7 实现 unpublishArticle 方法
- [x] 9.8 实现 deleteArticle 方法
- [x] 9.9 实现 validateArticleUrl 方法
- [x] 9.10 实现 checkDuplicateArticle 方法

## 10. 运营后台 - 文章列表页

- [x] 10.1 实现文章列表表格 (标题、分类、状态、发布时间、操作)
- [x] 10.2 实现分页组件
- [x] 10.3 实现状态筛选 (全部/草稿/已发布)
- [x] 10.4 实现分类筛选
- [x] 10.5 实现关键词搜索
- [x] 10.6 实现"新增文章"按钮
- [x] 10.7 实现操作按钮 (编辑、发布、下线、删除)
- [x] 10.8 实现删除确认弹窗
- [x] 10.9 添加待确认区域 (展示公众号自动同步的文章,可选) — 暂不实现，短期无自动同步能力

## 11. 运营后台 - 文章编辑页

- [x] 11.1 实现文章表单 (标题、摘要、封面图 URL、公众号链接、分类、排序权重)
- [x] 11.2 实现公众号链接输入框的实时校验
- [x] 11.3 实现自动提取文章信息并填充表单
- [x] 11.4 实现重复文章检查提示
- [x] 11.5 实现封面图预览
- [x] 11.6 实现"保存草稿"按钮
- [x] 11.7 实现"发布"按钮
- [x] 11.8 实现表单校验 (必填字段、字段长度)
- [x] 11.9 实现返回列表功能

## 12. 运营后台 - 样式与交互

- [x] 12.1 调整文章列表页样式 (表格、按钮、筛选栏)
- [x] 12.2 调整文章编辑页样式 (表单、输入框、按钮)
- [x] 12.3 添加加载状态提示
- [x] 12.4 添加成功/失败提示 (Toast)
- [ ] 12.5 优化移动端适配 (可选)

## 13. 小程序 - API 封装

- [x] 13.1 在 miniapp/src/services/api.ts 添加文章相关 API 方法
- [x] 13.2 实现 getArticles 方法 (获取文章列表)
- [x] 13.3 实现 getArticle 方法 (获取文章详情)
- [x] 13.4 实现 recordArticleView 方法 (记录浏览,可选)

## 14. 小程序 - 信息展示列表页改造

- [x] 14.1 修改 miniapp/src/pages/index/index.tsx 的信息展示 tab 逻辑
- [x] 14.2 调用 getArticles 接口获取文章列表
- [x] 14.3 实现文章卡片组件 (封面图、标题、摘要、时间)
- [x] 14.4 实现分页加载
- [x] 14.5 实现下拉刷新
- [x] 14.6 实现分类筛选 (可选)
- [x] 14.7 实现空状态展示
- [x] 14.8 实现点击文章跳转详情

## 15. 小程序 - web-view 页面

- [x] 15.1 创建 miniapp/src/pages/webview/index.tsx
- [x] 15.2 创建 miniapp/src/pages/webview/index.config.ts
- [x] 15.3 实现 WebView 组件加载公众号文章
- [x] 15.4 实现加载状态提示
- [x] 15.5 实现加载失败提示
- [x] 15.6 添加返回提示 (可选)
- [x] 15.7 在 app.config.ts 中注册 webview 页面路由

## 16. 小程序 - 样式与交互

- [x] 16.1 调整文章列表卡片样式
- [x] 16.2 调整 web-view 页面样式
- [x] 16.3 优化加载动画
- [x] 16.4 优化空状态展示
- [ ] 16.5 测试不同机型的兼容性

## 17. 小程序 - 业务域名配置

- [ ] 17.1 在微信公众平台小程序后台配置业务域名 mp.weixin.qq.com
- [ ] 17.2 下载校验文件并上传到服务器
- [ ] 17.3 测试生产环境 web-view 是否能正常加载公众号文章

## 18. 集成测试

- [ ] 18.1 测试完整流程: 运营后台创建文章 → 发布 → 小程序查看
- [ ] 18.2 测试自动校验和提取功能
- [ ] 18.3 测试重复文章检查
- [ ] 18.4 测试状态流转 (发布、下线、重新发布)
- [ ] 18.5 测试操作日志记录
- [ ] 18.6 测试小程序 web-view 加载公众号文章
- [ ] 18.7 测试分页、筛选、搜索功能
- [ ] 18.8 测试文章置顶功能

## 19. 文档更新

- [x] 19.1 更新 docs/01-项目导览.md (添加文章管理功能)
- [x] 19.2 更新 docs/04-API文档.md (添加文章管理接口)
- [x] 19.3 更新 docs/05-数据库设计.md (添加 articles 表和 article_operation_logs 表)
- [x] 19.4 更新 docs/others/接口文档-前端与小程序.md (添加文章接口)
- [x] 19.5 更新 docs/others/后台管理接口文档.md (添加文章管理接口)

## 20. 部署与上线

- [ ] 20.1 在测试环境部署后端 (执行数据库迁移)
- [ ] 20.2 在测试环境部署运营后台
- [ ] 20.3 在测试环境部署小程序 (体验版)
- [ ] 20.4 运营人员测试验收
- [ ] 20.5 修复测试中发现的问题
- [ ] 20.6 在生产环境部署后端
- [ ] 20.7 在生产环境部署运营后台
- [ ] 20.8 小程序提交审核
- [ ] 20.9 小程序审核通过后发布
- [ ] 20.10 监控上线后的运行状况
