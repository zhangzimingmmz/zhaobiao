## ADDED Requirements

### Requirement: 手机号验证码登录
`POST /api/auth/login` SHALL 接受 `{ "mobile": "11位手机号", "captcha": "验证码" }` 请求体，校验验证码有效性，成功后返回 JWT token；若验证码不匹配则返回 400 错误。

#### Scenario: 登录成功
- **WHEN** 提交正确手机号与匹配的验证码（Mock 阶段为 `123456`）
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "token": "<JWT>", "userId": "<id>", "mobile": "<phone>" } }`；若用户不存在则自动创建

#### Scenario: 验证码错误
- **WHEN** 提交手机号与错误验证码
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "验证码错误" }`

#### Scenario: 手机号格式不正确
- **WHEN** 提交手机号不是 11 位纯数字
- **THEN** 响应 HTTP 200，body 为 `{ "code": 400, "message": "手机号格式不正确" }`

### Requirement: JWT token 有效期
登录成功生成的 JWT token SHALL 设置有效期，默认 7 天；token payload 中包含 `userId` 和 `mobile`。

#### Scenario: token 过期
- **WHEN** 使用已过期的 token 请求鉴权接口
- **THEN** 响应 HTTP 200，body 为 `{ "code": 401, "message": "token 已过期，请重新登录" }`

#### Scenario: token 无效
- **WHEN** 使用格式错误或签名不匹配的 token
- **THEN** 响应 HTTP 200，body 为 `{ "code": 401, "message": "token 无效" }`
