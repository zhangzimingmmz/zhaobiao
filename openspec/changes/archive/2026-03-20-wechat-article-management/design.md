## Context

当前系统小程序「信息展示」tab 只展示爬虫自动采集的数据(采购意向、政策文件等),运营人员无法人工编辑发布内容。业务需要在该板块发布单位动态、政策法规、相关公告等图文信息。

运营人员已在微信公众号发布图文内容,具备完善的编辑能力和图片托管。为降低开发成本和内容生产成本,选择复用公众号文章,通过小程序 web-view 组件展示公众号文章完整内容。

技术约束:
- 后端使用 FastAPI + SQLite,单实例部署
- 运营后台使用 React + Vite
- 小程序使用 Taro(React)框架
- 数据库为 SQLite,需考虑迁移脚本的幂等性
- 生产环境需配置小程序业务域名 mp.weixin.qq.com

## Goals / Non-Goals

**Goals:**
- 运营人员能在后台管理系统创建、编辑、发布、下线文章
- 自动校验公众号链接格式和有效性
- 自动提取公众号文章信息(标题、封面图、摘要),减少人工录入错误
- 检查重复文章,防止同一链接多次发布
- 记录操作日志,追溯文章创建、发布、修改等操作
- 小程序用户能浏览文章列表,点击后通过 web-view 查看公众号文章完整内容
- 支持文章置顶、分类筛选、分页查询

**Non-Goals:**
- 不实现富文本编辑器(复用公众号编辑能力)
- 不存储文章正文内容(只存储元数据)
- 不实现图片上传和存储(公众号自带 CDN)
- 不实现自动同步公众号文章(短期方案为人工录入)
- 不实现文章评论、点赞等互动功能
- 不实现文章审核流程(运营人员直接发布)

## Decisions

### 决策1: 使用公众号文章链接 + web-view 展示

**选择**: 存储公众号文章链接,小程序使用 web-view 组件加载公众号文章

**理由**:
- 复用公众号编辑能力,无需自建富文本编辑器
- 公众号图片自动托管在微信 CDN,无需处理图片存储
- 用户熟悉公众号文章阅读体验
- 开发成本低,1-2周可上线

**替代方案**:
- 方案A: 自建富文本编辑器 + 本地图片存储
  - 优点: 内容完全可控,可自定义样式
  - 缺点: 开发成本高(需要 Quill.js 集成、图片上传、静态服务配置),图片存储和备份需要额外处理
- 方案B: 爬取公众号文章 HTML 并渲染
  - 优点: 内容在自己数据库
  - 缺点: 违反微信服务条款,图片防盗链无法加载,维护成本高

**Trade-off**: 内容不可控(公众号改了标题/内容,小程序跟着变;公众号删除文章,小程序失效),但通过运营规范和链接监控可降低影响

### 决策2: 人工录入 + 自动校验和提取

**选择**: 运营人员手动复制公众号链接,后端自动校验链接并提取文章信息

**理由**:
- 快速上线,无需配置公众号推送或 API 权限
- 自动提取标题、封面图、摘要,减少人工录入错误
- 自动检查重复文章,防止同一链接多次发布
- 为后续自动化(微信推送、API 拉取)预留扩展空间

**实现方式**:
```python
# 后端接口: POST /api/admin/articles/validate-url
# 1. 校验链接格式 (必须以 https://mp.weixin.qq.com/s 开头)
# 2. 访问链接,检查是否可访问 (requests.get, timeout=10s)
# 3. 解析 HTML,提取标题、封面图、摘要 (BeautifulSoup4)
# 4. 返回提取的信息给前端,自动填充表单
```

**替代方案**:
- 方案A: 完全人工录入
  - 优点: 实现简单
  - 缺点: 容易出错(链接错误、标题不一致、封面图失效)
- 方案B: 微信公众号推送(中期方案)
  - 优点: 完全自动化,运营只需确认
  - 缺点: 需要公众号认证,需要配置服务器推送 URL

### 决策3: 简单二态状态管理 (draft/published)

**选择**: 文章状态只有 draft(草稿)和 published(已发布)两种,支持下线操作(published → unpublished)

**理由**:
- 满足基本需求(创建草稿、发布、下线)
- 实现简单,状态流转清晰
- 为后续扩展(归档、定时发布)预留空间

**状态流转**:
```
draft → published (发布)
published → unpublished (下线)
unpublished → published (重新发布)
```

**替代方案**:
- 方案A: 复杂状态管理 (draft → pending_review → approved → published → archived)
  - 优点: 支持审核流程
  - 缺点: 当前只有 1-3 个运营人员,无需审核流程,增加复杂度

### 决策4: SQLite 存储 + 操作日志表

**选择**: 使用 SQLite 存储文章元数据,新增 articles 表和 article_operation_logs 表

**理由**:
- 与现有系统一致(notices 表也用 SQLite)
- 单实例部署,SQLite 性能足够(< 10万条记录)
- 操作日志表记录所有操作,便于追溯和审计

**表结构**:
```sql
-- articles 表
CREATE TABLE articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT,
    cover_image_url TEXT,
    wechat_article_url TEXT NOT NULL UNIQUE,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    sort_order INTEGER DEFAULT 0,
    publish_time TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT
);

-- article_operation_logs 表
CREATE TABLE article_operation_logs (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    operator_name TEXT,
    old_data TEXT,
    new_data TEXT,
    created_at TEXT NOT NULL
);
```

**替代方案**:
- 方案A: PostgreSQL
  - 优点: 支持并发写入,适合多实例部署
  - 缺点: 当前单实例部署,SQLite 够用,增加运维复杂度

### 决策5: 小程序 web-view 加载公众号文章

**选择**: 小程序使用 `<WebView>` 组件加载公众号文章完整内容

**理由**:
- 微信官方支持,稳定可靠
- 公众号文章有微信 CDN 加速,加载速度快
- 用户熟悉的阅读体验

**实现方式**:
```typescript
// miniapp/src/pages/webview/index.tsx
<WebView src={decodeURIComponent(wechatArticleUrl)} />
```

**注意事项**:
- 开发环境: 微信开发者工具勾选"不校验合法域名"
- 生产环境: 小程序后台配置业务域名 mp.weixin.qq.com

**Trade-off**: 用户会感觉"跳出"小程序,但通过 UI 优化(加载提示、返回提示)可降低影响

### 决策6: 前端自动填充 + 后端校验

**选择**: 前端在用户输入公众号链接后,实时调用后端接口校验并提取信息,自动填充表单;后端在创建文章时再次校验

**理由**:
- 提升用户体验,减少手动输入
- 前后端双重校验,确保数据有效性
- 防止重复文章,提前提示用户

**实现方式**:
```typescript
// 前端: 实时校验和提取
const handleUrlChange = async (url: string) => {
  const res = await api.validateArticleUrl(url)
  if (res.data.valid) {
    setForm({
      ...form,
      title: res.data.title,
      coverImageUrl: res.data.cover,
      summary: res.data.summary
    })
  }
  
  // 检查重复
  const duplicate = await api.checkDuplicateArticle(url)
  if (duplicate.data.exists) {
    alert(`该文章已存在: ${duplicate.data.article.title}`)
  }
}
```

## Risks / Trade-offs

### 风险1: web-view 加载公众号文章可能失败
**风险**: 公众号文章被删除、链接失效、网络问题导致加载失败

**缓解措施**:
- 创建文章时校验链接有效性
- 定期检查已发布文章的链接状态(可选,后续优化)
- 小程序展示友好错误提示

### 风险2: 公众号内容变化导致数据不一致
**风险**: 公众号改了标题/封面/内容,小程序列表展示的元数据是旧的

**缓解措施**:
- 运营规范: 公众号文章发布后不随意修改
- 提供"同步公众号内容"功能,手动更新元数据(可选,后续优化)

### 风险3: 人工录入仍可能出错
**风险**: 运营人员复制错链接、选错分类

**缓解措施**:
- 自动校验链接格式和有效性
- 自动提取文章信息,减少手动输入
- 检查重复文章,防止重复发布
- 操作日志记录,便于追溯和纠错

### 风险4: SQLite 并发写入限制
**风险**: 多个运营人员同时编辑文章可能冲突

**缓解措施**:
- 当前只有 1-3 个运营人员,并发写入概率极低
- 后续如需多实例部署,可迁移到 PostgreSQL

### 风险5: 用户体验断层
**风险**: 列表在小程序内,详情在 web-view 里,用户感觉"跳出"小程序

**缓解措施**:
- 添加加载提示,优化等待体验
- 添加返回提示,引导用户返回列表
- 这是方案的本质特性,短期内可接受

## Migration Plan

### 部署步骤

1. **数据库迁移**
   ```bash
   # 在 crawler/migrations/ 添加迁移脚本
   # 001_create_articles_table.sql
   # 启动时自动执行(幂等)
   ```

2. **后端部署**
   ```bash
   # 安装依赖
   pip install requests beautifulsoup4
   
   # 重启 API 服务
   docker-compose -f docker-compose.backend.yml restart api
   ```

3. **运营后台部署**
   ```bash
   # 构建前端
   cd admin-frontend && npm run build
   
   # 重启 nginx 容器
   docker-compose -f docker-compose.backend.yml restart admin-frontend
   ```

4. **小程序部署**
   ```bash
   # 构建小程序
   cd miniapp && npm run build:weapp
   
   # 上传到微信公众平台
   # 配置业务域名: mp.weixin.qq.com
   # 提交审核
   ```

### 回滚策略

- 数据库: articles 表和 article_operation_logs 表为新增,不影响现有功能,可直接删除
- 后端: 新增接口,不影响现有接口,可直接回滚代码
- 运营后台: 新增页面,不影响现有页面,可直接回滚代码
- 小程序: 改造「信息展示」tab,需要回滚到旧版本(展示爬虫数据)

### 数据迁移

无需数据迁移,为全新功能

## Open Questions

1. **是否需要文章浏览统计?**
   - 当前设计包含 view_count 字段,但未实现详细统计(如按日期、用户维度)
   - 建议: 先实现简单计数,后续根据需求扩展

2. **是否需要定时检查链接有效性?**
   - 当前设计包含 link_status 字段,但未实现定时检查
   - 建议: 先手动检查,后续根据需求添加定时任务

3. **是否需要批量导入历史文章?**
   - 如果公众号有大量历史文章需要导入
   - 建议: 提供批量导入脚本或 CSV 导入功能(后续优化)

4. **是否需要文章分享功能?**
   - 小程序是否需要分享文章到微信好友/朋友圈
   - 建议: 先实现基本功能,后续根据需求添加分享
