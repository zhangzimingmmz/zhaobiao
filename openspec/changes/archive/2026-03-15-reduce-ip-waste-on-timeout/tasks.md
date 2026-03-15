## 1. 配置层：统一超时与错误分类常量

- [x] 1.1 在 `crawler/site2/config.py` 中新增 `REQUEST_TIMEOUT = 30`
- [x] 1.2 在 `crawler/site2/config.py` 中新增 `PROXY_ERROR_KEYWORDS` 列表：`["ProxyError", "RemoteDisconnected", "SSLError", "SSLEOFError", "IncompleteRead"]`

## 2. session 层：错误分类工具函数

- [x] 2.1 在 `crawler/site2/session.py` 中新增 `is_proxy_error(exc)` 函数，根据异常类型名和字符串匹配 `PROXY_ERROR_KEYWORDS` 返回布尔值

## 3. client 层：使用配置超时 + 传播传输异常

- [x] 3.1 修改 `crawler/site2/client.py` 的 `fetch_list`：将 `timeout=15` 替换为 `timeout=config.REQUEST_TIMEOUT`
- [x] 3.2 修改 `crawler/site2/client.py` 的 `fetch_detail`：将 `timeout=15` 替换为 `timeout=config.REQUEST_TIMEOUT`
- [x] 3.3 修改 `fetch_list` 的 except 块：对 `requests.exceptions.ReadTimeout`、`requests.exceptions.ProxyError`、`requests.exceptions.ConnectionError` 重新 raise，仅捕获业务层错误返回空结果
- [x] 3.4 修改 `fetch_detail` 的 except 块：同 3.3 的逻辑，传播传输异常

## 4. core 层：智能重试（按错误类型决定是否换 IP）

- [x] 4.1 修改 `process_window` 的 list 循环：用 try/except 包裹 `fetch_list` 调用，捕获异常后调用 `is_proxy_error(e)` 判断——代理错误换 session，超时错误保持 session 并 sleep 后重试
- [x] 4.2 修改 `process_window` 的 detail 重试循环：捕获异常后调用 `is_proxy_error(e)` 判断——代理错误换 session，超时错误保持 session 重试

## 5. 验证

- [x] 5.1 用 `scripts/diagnose_network.py` 验证新超时值生效（成功率应提升）
- [x] 5.2 跑一次小范围 backfill（单日 window），确认 IP 消耗 < 5 个
