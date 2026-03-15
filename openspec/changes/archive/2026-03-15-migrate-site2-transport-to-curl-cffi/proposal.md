## Why

网站二当前的主要阻塞点已经从签名、验证码识别和任务编排，收敛到 `requests/urllib3 + 代理 + 四川采购网` 这条 HTTP 传输链路本身。在最近的真实网络验证里，`curl`、`curl_cffi`、`httpx` 通过相同代理可以访问验证码和列表接口，而 `requests` 对目标站 HTTPS 接口持续高频失败，导致 `backfill`、`reconcile` 等任务无法稳定运行。

## What Changes

- 将 site2 的 HTTP 传输层从当前以 `requests` 为中心的实现，重构为默认使用与 `curl` 行为更接近的客户端栈
- 统一验证码、列表、探测和详情接口的请求实现，避免出现“验证码能过、列表仍卡在 requests”这种分裂路径
- 明确 site2 会话对象对 transport 层的抽象边界，使签名、Cookie、代理、超时和错误分类不再绑定 `requests.Session`
- 保留现有窗口调度、OCR、签名和落库逻辑，只替换 transport 相关实现，并补齐回归测试与真实网络 smoke 验证

## Capabilities

### New Capabilities

### Modified Capabilities
- `site2-crawler`: 调整 site2 会话与接口抓取的传输要求，不再要求必须依赖 `requests.Session`，而要求使用可在当前代理环境下稳定访问目标站 HTTPS 接口的客户端实现

## Impact

- 影响代码：`crawler/site2/session.py`、`crawler/site2/client.py`、`crawler/site2/tasks/core.py` 及相关测试
- 影响依赖：新增或正式采用 `curl_cffi`（备选为 `httpx`），并减少对 `requests` 作为主传输层的依赖
- 影响运行行为：site2 的验证码、列表、详情接口将通过同一类 curl-compatible transport 发起，降低代理兼容性抖动
- 不改变数据库 schema、签名算法、窗口策略和 `notices` 表写入契约
