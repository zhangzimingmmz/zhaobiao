## 1. Transport Abstraction

- [x] 1.1 新增 site2 transport 辅助层，封装 `curl_cffi` session、GET 请求、bytes/JSON 读取和基础错误转换
- [x] 1.2 在 transport 层统一代理、headers、cookies、超时和关闭逻辑，避免 `session.py` / `client.py` 直接依赖具体 HTTP 库

## 2. Session Bootstrap Migration

- [x] 2.1 重构 `crawler/site2/session.py`，让 `create_session()` 返回逻辑会话对象而不是假定为 `requests.Session`
- [x] 2.2 将验证码抓取和代理健康检查统一迁移到新 transport，移除“验证码走 curl、其余走 requests”的主路径分裂
- [x] 2.3 更新代理错误识别与 session 轮换逻辑，使其覆盖 `curl_cffi` 抛出的异常模式

## 3. List and Detail Request Migration

- [x] 3.1 将 `probe_total` 与 `fetch_list` 切换到新 transport，并保持现有签名、参数和返回结构不变
- [x] 3.2 将 `fetch_detail` 切换到新 transport，并保持两类 notice 的详情映射行为不变
- [x] 3.3 校验 `tasks/core.py` 中的 window 执行、重试和 detail 并发逻辑与新会话对象兼容

## 4. Verification

- [x] 4.1 更新或新增单元测试，覆盖 transport mock、session bootstrap、代理健康检查和列表/详情调用
- [x] 4.2 运行本地回归测试，确认 site2 现有逻辑和相关回归用例通过
- [x] 4.3 使用真实代理环境跑 `create_session()` 和 `reconcile` 单日 smoke test，确认验证码和列表接口都可稳定访问
