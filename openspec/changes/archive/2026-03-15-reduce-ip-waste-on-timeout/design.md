## Context

当前 site2 爬虫存在两个问题导致严重的代理 IP 浪费：

1. **超时值过短**：`client.py` 中 `fetch_list` 和 `fetch_detail` 均硬编码 `timeout=15`，而目标站在低峰时段（凌晨）API 响应可达 10-20 秒，导致大量 `ReadTimeout`。
2. **错误处理不分类型**：`core.py` 中所有错误（包括 `ReadTimeout`）都触发 `session.create_session()` 换 IP，但诊断表明 `ReadTimeout` 时代理通道本身正常（验证码 0.5s 返回），换 IP 纯属浪费。

当前代码路径（`core.py`）中触发换 IP 的位置：
- L72：`fetch_list` 返回空行时 → `create_session()`
- L95：`fetch_detail` 重试失败时 → `create_session()`
- L176：window 级异常时 → `sess = None`（下次 ensure_fresh 换 IP）

## Goals / Non-Goals

**Goals:**
- 将请求超时从 15s 提升到 30s，适配目标站慢响应
- 区分「代理故障」和「目标站慢」两类错误
- 仅在代理故障时才换 IP，超时时复用同一 session 重试
- 预计 IP 消耗降低 60-80%

**Non-Goals:**
- 不修改 session TTL 逻辑（已在 stabilize-site2-crawler-pipeline 中完成）
- 不增加并发/并行（属于 8.4 可选优化）
- 不修改 windowing 或 storage 逻辑

## Decisions

### D1: 统一超时配置

在 `config.py` 新增 `REQUEST_TIMEOUT = 30`，`client.py` 所有请求引用此配置。

**理由**：硬编码超时分散在多处（fetch_list、fetch_detail），不易调整。集中到 config 后，可随时段或站点特性微调。30s 基于诊断数据中成功请求最长耗时 9.9s，加倍留余量。

### D2: 错误分类函数 `is_proxy_error(e)`

在 `session.py` 新增工具函数，根据异常类型判断是否为代理故障：

```python
PROXY_ERROR_KEYWORDS = ["ProxyError", "RemoteDisconnected", "SSLError", "SSLEOFError", "IncompleteRead"]

def is_proxy_error(exc):
    exc_str = f"{type(exc).__name__}: {exc}"
    return any(kw in exc_str for kw in PROXY_ERROR_KEYWORDS)
```

`ReadTimeout` / `ConnectionTimeout` 不在列表中 → 不触发换 IP。

**备选方案**：在 `core.py` 内联判断 → 不易维护，判断逻辑分散。

### D3: client.py 抛异常而非吞掉

当前 `client.py` 的 `fetch_list`/`fetch_detail` 在 except 块中 `return {}` / `return {"total": 0, "rows": []}`，调用方无法知道是真的"无数据"还是"请求失败"。

改为：将 `requests.exceptions.ReadTimeout` 和代理相关异常向上抛出，让 `core.py` 根据异常类型做出决策。业务错误（API 返回非 200 code）仍返回空结果。

### D4: core.py 重试逻辑重构

在 detail 重试循环和 list 空行处理中：
- 捕获异常后先调用 `is_proxy_error(e)`
- 代理故障 → `sess = create_session()`
- 超时/网络慢 → 保持当前 sess，sleep 后重试

## Risks / Trade-offs

- **[30s 超时可能拖慢整体速度]** → 在快速时段（白天），目标站通常 1-3s 响应，30s 上限不会被触及；慢时段宁可等 30s 也比换 IP 再等更省
- **[错误分类可能遗漏新错误类型]** → `PROXY_ERROR_KEYWORDS` 放在 config 层，发现新类型时加一行即可
- **[client.py 抛异常是 breaking change]** → core.py 是唯一调用方，同步修改即可
