## ADDED Requirements

### Requirement: 系统提供文章 CRUD 能力
系统 SHALL 提供完整的文章创建、读取、更新、删除能力。文章 MUST 包含标题、摘要、封面图 URL、公众号文章链接、分类、状态、排序权重等字段。

#### Scenario: 创建文章成功
- **WHEN** 管理员提交有效的文章信息(标题、公众号链接)
- **THEN** 系统创建文章记录,状态为 draft,返回文章 ID

#### Scenario: 创建文章时标题为空
- **WHEN** 管理员提交文章但标题为空
- **THEN** 系统返回 400 错误,提示"标题不能为空"

#### Scenario: 创建文章时公众号链接无效
- **WHEN** 管理员提交文章但公众号链接格式错误
- **THEN** 系统返回 400 错误,提示"无效的公众号文章链接"

#### Scenario: 更新文章成功
- **WHEN** 管理员更新文章的标题或摘要
- **THEN** 系统更新文章记录,updated_at 字段更新为当前时间

#### Scenario: 删除文章成功
- **WHEN** 管理员删除文章
- **THEN** 系统从数据库中删除该文章记录

### Requirement: 系统提供文章状态流转能力
系统 SHALL 支持文章在 draft、published、unpublished 状态之间流转。

#### Scenario: 发布草稿文章
- **WHEN** 管理员对状态为 draft 的文章执行发布操作
- **THEN** 系统将文章状态更新为 published,设置 publish_time 为当前时间

#### Scenario: 下线已发布文章
- **WHEN** 管理员对状态为 published 的文章执行下线操作
- **THEN** 系统将文章状态更新为 unpublished,保留 publish_time

#### Scenario: 重新发布已下线文章
- **WHEN** 管理员对状态为 unpublished 的文章执行发布操作
- **THEN** 系统将文章状态更新为 published,更新 publish_time 为当前时间

#### Scenario: 对已发布文章执行发布操作
- **WHEN** 管理员对状态为 published 的文章执行发布操作
- **THEN** 系统返回 400 错误,提示"文章已发布"

### Requirement: 系统提供文章列表查询能力
系统 SHALL 提供文章列表查询接口,支持分页、状态筛选、分类筛选、关键词搜索。

#### Scenario: 查询所有文章
- **WHEN** 管理员请求文章列表,不指定筛选条件
- **THEN** 系统返回所有文章,按创建时间倒序排列

#### Scenario: 按状态筛选文章
- **WHEN** 管理员请求文章列表,指定 status=draft
- **THEN** 系统只返回状态为 draft 的文章

#### Scenario: 按分类筛选文章
- **WHEN** 管理员请求文章列表,指定 category=单位动态
- **THEN** 系统只返回分类为"单位动态"的文章

#### Scenario: 关键词搜索文章
- **WHEN** 管理员请求文章列表,指定 keyword=培训
- **THEN** 系统返回标题或摘要中包含"培训"的文章

#### Scenario: 分页查询文章
- **WHEN** 管理员请求文章列表,指定 page=2, pageSize=10
- **THEN** 系统返回第 11-20 条文章记录

### Requirement: 系统记录文章操作日志
系统 SHALL 记录所有文章的创建、更新、发布、下线、删除操作,包含操作人、操作时间、操作类型。

#### Scenario: 创建文章时记录日志
- **WHEN** 管理员创建文章
- **THEN** 系统在 article_operation_logs 表中插入一条 operation=create 的记录

#### Scenario: 发布文章时记录日志
- **WHEN** 管理员发布文章
- **THEN** 系统在 article_operation_logs 表中插入一条 operation=publish 的记录,包含操作人信息

#### Scenario: 查询文章操作历史
- **WHEN** 管理员查询某篇文章的操作历史
- **THEN** 系统返回该文章的所有操作记录,按时间倒序排列

### Requirement: 系统提供文章置顶能力
系统 SHALL 支持通过 sort_order 字段控制文章排序,数值越大越靠前。

#### Scenario: 设置文章置顶
- **WHEN** 管理员将文章的 sort_order 设置为 10
- **THEN** 该文章在列表中排在 sort_order 小于 10 的文章之前

#### Scenario: 取消文章置顶
- **WHEN** 管理员将文章的 sort_order 设置为 0
- **THEN** 该文章按正常时间顺序排列

### Requirement: 小程序端只能查询已发布文章
系统 SHALL 确保小程序端接口只返回 status=published 的文章。

#### Scenario: 小程序查询文章列表
- **WHEN** 小程序请求文章列表
- **THEN** 系统只返回 status=published 的文章,按 publish_time 倒序排列

#### Scenario: 小程序查询草稿文章详情
- **WHEN** 小程序请求状态为 draft 的文章详情
- **THEN** 系统返回 404 错误

#### Scenario: 小程序查询已下线文章详情
- **WHEN** 小程序请求状态为 unpublished 的文章详情
- **THEN** 系统返回 404 错误
