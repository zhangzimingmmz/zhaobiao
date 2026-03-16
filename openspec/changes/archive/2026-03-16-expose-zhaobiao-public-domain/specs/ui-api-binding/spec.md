## MODIFIED Requirements

### Requirement: 前端可配置 API base URL

系统 SHALL 通过环境变量（如 `VITE_API_BASE`）或配置指定公告 API 的 base URL。开发环境默认指向本地公告 API（如 `http://localhost:8000`）；生产-like 构建 MUST 支持切换到公网 HTTPS API 域名（如 `https://api-zhaobiao.zhangziming.cn`）。数据请求层 MUST 使用该配置拼接完整 URL，且生产-like 配置不得依赖 Tailscale / 内网地址。

#### Scenario: 开发环境使用本地 API

- **WHEN** `VITE_API_BASE` 为 `http://localhost:8000`
- **THEN** 列表与详情请求发往 `http://localhost:8000/api/list`、`http://localhost:8000/api/detail/bid/:id`

#### Scenario: 生产-like 构建使用公网 API 域名

- **WHEN** `VITE_API_BASE` 为 `https://api-zhaobiao.zhangziming.cn`
- **THEN** 列表与详情请求发往 `https://api-zhaobiao.zhangziming.cn/api/list`、`https://api-zhaobiao.zhangziming.cn/api/detail/bid/:id`
