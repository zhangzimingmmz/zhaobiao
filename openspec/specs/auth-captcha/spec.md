## ADDED Requirements

### Requirement: 获取验证码（Mock 模式）
`GET /api/auth/captcha` SHALL 返回 JSON 格式的验证码数据；初期使用 Mock 模式，固定验证码为 `123456`，同时生成一个 base64 占位图片。后端需将验证码与请求手机号（若提供）或 session key 关联，用于登录时校验。

#### Scenario: 不传 mobile 参数
- **WHEN** 请求 `GET /api/auth/captcha`（无 mobile 参数）
- **THEN** 响应 HTTP 200，body 为 `{ "code": 200, "data": { "imageBase64": "<base64字符串>", "key": "<唯一key>" } }`

#### Scenario: 传入 mobile 参数
- **WHEN** 请求 `GET /api/auth/captcha?mobile=13800138000`
- **THEN** 响应 HTTP 200，body 格式同上；后端以 `mobile` 为 key 缓存验证码供登录校验

#### Scenario: Mock 验证码值
- **WHEN** 任意调用获取验证码接口
- **THEN** 实际验证码值为固定字符串 `123456`（Mock 阶段）；`imageBase64` 为任意可显示图片的 base64
