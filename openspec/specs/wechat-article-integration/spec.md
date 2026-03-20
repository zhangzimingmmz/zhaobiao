## ADDED Requirements

### Requirement: 系统验证公众号文章链接格式
系统 SHALL 验证公众号文章链接必须以 https://mp.weixin.qq.com/s 开头。

#### Scenario: 提交有效的公众号链接
- **WHEN** 管理员提交链接 https://mp.weixin.qq.com/s/xxx
- **THEN** 系统接受该链接

#### Scenario: 提交无效的公众号链接
- **WHEN** 管理员提交链接 https://example.com/article
- **THEN** 系统返回 400 错误,提示"无效的公众号文章链接"

#### Scenario: 提交空链接
- **WHEN** 管理员提交空的公众号链接
- **THEN** 系统返回 400 错误,提示"公众号文章链接不能为空"

### Requirement: 系统自动提取公众号文章信息
系统 SHALL 在管理员提交公众号链接后,自动访问该链接并提取标题、封面图、摘要等信息。

#### Scenario: 成功提取文章信息
- **WHEN** 管理员提交有效的公众号链接
- **THEN** 系统访问该链接,提取标题、封面图 URL、摘要,并返回给前端

#### Scenario: 公众号链接无法访问
- **WHEN** 管理员提交的公众号链接返回 404
- **THEN** 系统返回 400 错误,提示"链接无法访问"

#### Scenario: 公众号链接访问超时
- **WHEN** 管理员提交的公众号链接访问超时(>10秒)
- **THEN** 系统返回 500 错误,提示"链接访问超时"

### Requirement: 系统检查重复文章
系统 SHALL 在创建文章前检查该公众号链接是否已存在。

#### Scenario: 提交已存在的公众号链接
- **WHEN** 管理员提交的公众号链接已存在于数据库中
- **THEN** 系统返回 409 错误,提示"该文章已存在",并返回已存在文章的 ID 和标题

#### Scenario: 提交新的公众号链接
- **WHEN** 管理员提交的公众号链接不存在于数据库中
- **THEN** 系统允许创建文章

### Requirement: 系统提供文章链接有效性检查
系统 SHALL 提供接口检查已发布文章的公众号链接是否仍然有效。

#### Scenario: 检查有效的文章链接
- **WHEN** 系统检查某篇文章的公众号链接
- **THEN** 如果链接返回 200,系统标记该文章 link_status=active

#### Scenario: 检查失效的文章链接
- **WHEN** 系统检查某篇文章的公众号链接
- **THEN** 如果链接返回 404,系统标记该文章 link_status=broken

#### Scenario: 批量检查文章链接
- **WHEN** 管理员触发批量检查
- **THEN** 系统检查所有已发布文章的链接,更新 link_status 字段

### Requirement: 系统提供同步公众号内容功能
系统 SHALL 提供接口重新抓取公众号文章信息,更新本地元数据。

#### Scenario: 同步单篇文章
- **WHEN** 管理员对某篇文章执行同步操作
- **THEN** 系统重新访问公众号链接,提取最新的标题、封面图、摘要,更新数据库

#### Scenario: 同步时公众号文章已删除
- **WHEN** 管理员对某篇文章执行同步操作,但公众号文章已被删除
- **THEN** 系统标记该文章 link_status=deleted,并通知管理员

#### Scenario: 批量同步所有文章
- **WHEN** 管理员触发批量同步
- **THEN** 系统逐个同步所有已发布文章的内容

### Requirement: 数据库唯一约束防止重复
系统 SHALL 在 articles 表的 wechat_article_url 字段上创建唯一索引。

#### Scenario: 插入重复的公众号链接
- **WHEN** 系统尝试插入已存在的公众号链接
- **THEN** 数据库抛出唯一约束错误,系统捕获并返回友好错误信息
