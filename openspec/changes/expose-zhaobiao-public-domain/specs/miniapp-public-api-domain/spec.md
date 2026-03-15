## ADDED Requirements

### Requirement: 小程序 SHALL 在生产-like 构建中使用公网 HTTPS API 域名

小程序的请求层 SHALL 支持将 API base URL 配置为公网 HTTPS 域名。在生产-like 构建或真机联调场景中，小程序 MUST 使用公网 API 域名访问后端接口，而不是使用 `localhost`、`127.0.0.1` 或 `100.64.0.5` 这类仅内网可达地址。

#### Scenario: 生产-like 构建使用公网 API 域名
- **WHEN** 小程序按生产-like 配置构建，API base 被设置为公网 HTTPS 域名（例如 `https://api-zhaobiao.zhangziming.cn`）
- **THEN** 小程序发出的列表、详情、认证等请求都以该公网域名作为前缀

#### Scenario: 本地开发仍可使用本地 API
- **WHEN** 开发者在本地联调并显式将 API base 配置为 `http://localhost:8000`
- **THEN** 小程序请求继续指向本地 API，而不影响生产-like 域名配置能力

### Requirement: 小程序公网接入文档 SHALL 包含合法域名与验证步骤

系统 SHALL 在小程序相关文档中明确说明：生产-like API base 的配置方式、微信 request 合法域名配置要求，以及切换到公网域名后的验证步骤。

#### Scenario: 开发者按文档完成公网接入
- **WHEN** 开发者按照文档配置公网 API 域名并在微信后台添加 request 合法域名
- **THEN** 小程序可以在真机或线上环境中成功请求后端接口
