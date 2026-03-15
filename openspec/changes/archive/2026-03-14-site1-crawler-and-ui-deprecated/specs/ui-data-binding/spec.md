# Spec: ui-data-binding

## ADDED Requirements

### Requirement: 首页列表使用真实数据源

首页（Home）SHALL 从公告数据 API 获取列表数据以替代当前 Mock；SHALL 支持分页或「加载更多」；SHALL 在请求进行中展示加载状态（如骨架屏或 loading），在请求失败时展示错误态并可重试；展示字段与交互（点击进入详情等）SHALL 与现有设计一致。

#### Scenario: 首屏加载列表

- **WHEN** 用户进入首页
- **THEN** 发起列表 API 请求并展示加载状态，成功后渲染公告列表卡片，无 Mock 数据硬编码

#### Scenario: 加载失败可重试

- **WHEN** 列表 API 返回错误或超时
- **THEN** 页面展示错误提示并提供重试入口，不静默失败

#### Scenario: 列表项点击进入详情

- **WHEN** 用户点击某条公告卡片
- **THEN** 跳转至详情页并携带该条 id（与当前路由与设计一致）

---

### Requirement: 详情页使用真实数据源

详情页（Detail）SHALL 根据路由中的 id 请求公告详情 API 以替代当前 Mock；SHALL 在请求进行中展示加载状态，在 id 不存在或请求失败时展示错误态；展示内容（标题、时间、来源、正文、原文链接等）SHALL 与 DATA_STRUCTURE 及设计规范一致。

#### Scenario: 有效 id 展示详情

- **WHEN** 用户从列表进入详情页且 id 有效
- **THEN** 请求详情 API 并展示加载态，成功后展示标题、webdate、zhuanzai、content、原文链接等

#### Scenario: 无效 id 或 404 处理

- **WHEN** 详情 API 返回 404 或 id 不存在
- **THEN** 页面展示「未找到」或等效提示，并可返回首页或列表

#### Scenario: 详情加载失败可重试

- **WHEN** 详情 API 请求失败
- **THEN** 展示错误信息并提供重试，不静默失败

---

### Requirement: API 基地址可配置

前端 SHALL 通过环境变量或配置文件指定公告 API 的 base URL；开发环境 SHALL 可指向本地或 mock 服务器，以便在不启动真实 API 时仍可开发或使用 Mock 降级。

#### Scenario: 开发环境指向本地 API

- **WHEN** 配置 API base 为本地地址（如 http://localhost:8000）
- **THEN** 列表与详情请求发往该 base URL 下的约定路径

#### Scenario: 可切换回 Mock

- **WHEN** 配置或开关指定使用 Mock
- **THEN** 列表与详情不请求网络，使用本地静态或 Mock 数据，便于无后端联调
