## ADDED Requirements

### Requirement: 小程序展示文章列表
小程序 SHALL 在「信息展示」tab 展示已发布文章列表,包含封面图、标题、摘要、发布时间。

#### Scenario: 加载文章列表
- **WHEN** 用户进入「信息展示」tab
- **THEN** 小程序调用 GET /api/articles 接口,展示文章列表

#### Scenario: 文章列表为空
- **WHEN** 用户进入「信息展示」tab,但没有已发布文章
- **THEN** 小程序展示空状态提示"暂无信息展示内容"

#### Scenario: 文章列表分页加载
- **WHEN** 用户滚动到列表底部
- **THEN** 小程序自动加载下一页文章

#### Scenario: 文章列表下拉刷新
- **WHEN** 用户下拉列表
- **THEN** 小程序重新加载第一页文章

### Requirement: 小程序支持按分类筛选文章
小程序 SHALL 支持按分类(单位动态、政策法规、相关公告)筛选文章。

#### Scenario: 选择分类筛选
- **WHEN** 用户选择"单位动态"分类
- **THEN** 小程序只展示分类为"单位动态"的文章

#### Scenario: 清除分类筛选
- **WHEN** 用户点击"全部"
- **THEN** 小程序展示所有分类的文章

### Requirement: 小程序展示文章详情
小程序 SHALL 在用户点击文章后,跳转到 web-view 页面展示公众号文章完整内容。

#### Scenario: 点击文章跳转详情
- **WHEN** 用户点击文章列表中的某篇文章
- **THEN** 小程序调用 GET /api/articles/:id 获取文章详情,然后跳转到 web-view 页面

#### Scenario: web-view 加载公众号文章
- **WHEN** web-view 页面加载
- **THEN** 小程序使用 wechatArticleUrl 加载公众号文章完整内容

#### Scenario: web-view 加载失败
- **WHEN** web-view 加载公众号文章失败
- **THEN** 小程序展示错误提示"文章加载失败,请稍后重试"

### Requirement: 小程序支持文章列表置顶
小程序 SHALL 优先展示 sort_order 大于 0 的文章。

#### Scenario: 展示置顶文章
- **WHEN** 用户加载文章列表
- **THEN** sort_order > 0 的文章排在最前面,按 sort_order 降序排列

#### Scenario: 置顶文章后展示普通文章
- **WHEN** 用户加载文章列表
- **THEN** sort_order = 0 的文章按 publish_time 降序排列在置顶文章之后

### Requirement: web-view 页面配置业务域名
小程序 SHALL 在生产环境配置 mp.weixin.qq.com 为业务域名。

#### Scenario: 开发环境加载公众号文章
- **WHEN** 开发环境中 web-view 加载公众号文章
- **THEN** 需要在微信开发者工具中勾选"不校验合法域名"

#### Scenario: 生产环境加载公众号文章
- **WHEN** 生产环境中 web-view 加载公众号文章
- **THEN** 必须在小程序后台配置 mp.weixin.qq.com 为业务域名

### Requirement: 小程序提供返回列表功能
小程序 SHALL 在 web-view 页面提供返回列表的提示或按钮。

#### Scenario: 用户从详情返回列表
- **WHEN** 用户在 web-view 页面点击左上角返回
- **THEN** 小程序返回到文章列表页

#### Scenario: 展示返回提示
- **WHEN** 用户进入 web-view 页面
- **THEN** 小程序在顶部展示"点击左上角返回列表"提示(可选)

### Requirement: 小程序记录文章浏览
小程序 SHALL 在用户点击文章时记录浏览行为。

#### Scenario: 记录文章浏览
- **WHEN** 用户点击文章进入详情
- **THEN** 小程序调用 POST /api/articles/:id/view 接口记录浏览

#### Scenario: 浏览计数增加
- **WHEN** 用户浏览文章
- **THEN** 该文章的 view_count 字段加 1
