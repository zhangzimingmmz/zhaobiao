## Why

诊断发现，目标站（四川政采网）在凌晨时段 API 响应延迟达 10-20 秒，而当前代码请求超时设为 15 秒，导致大量 `Read timed out` 错误。每次超时后爬虫会丢弃当前 session 并提取新的代理 IP，但实际上代理本身没有问题（验证码接口 0.5 秒即返回），这造成了严重的 IP 浪费——单次 backfill 消耗 100+ 个 IP（测试配额仅 1000）。

## What Changes

- 将 HTTP 请求超时从 15 秒提升至 30 秒，适配目标站慢响应
- 超时错误不再触发 session/IP 轮换，改为在同一 session 内重试
- 区分「代理故障」和「目标站慢」两类错误，只在真正的代理故障时才换 IP
- 在 config 中新增 `REQUEST_TIMEOUT` 和 `PROXY_ERROR_TYPES` 配置项，便于调优

## Capabilities

### New Capabilities
- `smart-retry-strategy`: 智能重试策略——根据错误类型区分是否需要更换代理 IP，超时类错误复用当前 session 重试，代理类错误才换 IP

### Modified Capabilities
- `site2-crawler`: 调整请求超时参数和错误处理逻辑

## Impact

- `crawler/site2/config.py` — 新增 `REQUEST_TIMEOUT`、`PROXY_ERROR_TYPES` 配置
- `crawler/site2/client.py` — 使用 `REQUEST_TIMEOUT` 替代硬编码超时
- `crawler/site2/tasks/core.py` — 重构错误处理，按错误类型决定是否换 session
- `crawler/site2/session.py` — `ensure_fresh` 不受超时错误影响
- 预计 IP 消耗降低 60-80%
