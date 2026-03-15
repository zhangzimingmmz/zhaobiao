## Context

site2 目前已经具备签名生成、验证码 OCR、窗口调度、幂等落库和对账能力，但真实网络稳定性仍被 HTTP 传输层卡住。最近的对照测试已经把问题范围缩到非常具体的组合：在相同的代理产品、相同的目标站、相同的业务参数下，`requests/urllib3` 高频触发 `ProxyError` / `Remote end closed connection without response`，而 `curl`、`curl_cffi`、`httpx` 可以访问验证码接口，且 `curl_cffi`、`httpx` 可以打通真实列表接口并返回 JSON。

当前代码已经临时把验证码抓取切到了 shell `curl`，这证明“curl-compatible transport”是正确方向，但也造成 transport 路径分裂：验证码走 `curl`，列表和详情仍走 `requests`。这类分裂实现会继续放大 cookie、代理、超时、重试和错误分类的维护成本。因此这次设计需要把 site2 的 proxied HTTP 请求统一到一类 curl-compatible transport 上，同时尽量不触碰签名算法、窗口切分和落库逻辑。

## Goals / Non-Goals

**Goals:**
- 将 site2 的验证码、probe、列表、详情请求统一到同一种 curl-compatible transport
- 保留现有 `config.py`、签名生成、OCR、窗口调度、幂等 upsert 和日志结构
- 让 session 对象不再依赖 `requests.Session`，而是抽象为“带 cookie、headers、proxies、verifyCode、created_at 的逻辑会话”
- 在尽量少改业务逻辑的前提下，让 `reconcile`、`backfill`、`incremental`、`recovery` 重新能在真实代理环境下运行

**Non-Goals:**
- 不修改四川采购网的签名算法和业务参数结构
- 不重新设计窗口策略、对账口径或数据库 schema
- 不引入新的调度系统或额外外部服务
- 不同时支持多套主传输层并长期并行维护

## Decisions

### 1. 以 `curl_cffi` 作为 site2 的默认 HTTP 传输层

**选择**：将 site2 所有经代理访问四川采购网的 HTTP 请求统一迁移到 `curl_cffi.requests`，并把当前 shell `curl` 验证码 workaround 收敛为同一套 Python transport。

**理由**：`curl_cffi` 在当前环境里兼具两点优势：一是网络行为更接近已验证成功的 `curl`；二是仍然保留 Python API，避免把列表/详情请求全部退化为 shell 命令拼接。相较 `httpx`，`curl_cffi` 与已验证成功的路径更一致；相较 shell `curl`，它更适合作为长期维护的 transport 实现。

**替代方案：**
- **继续使用 shell `curl`**：成功概率高，但每个请求都起子进程，cookies、JSON、错误处理和并发管理都会变差
- **迁移到 `httpx`**：当前 spot test 可行，但在问题本质是“与 curl 行为贴近度”时，不如 `curl_cffi` 稳妥
- **继续等待代理供应商修复 `requests` 兼容性**：外部依赖强，不适合卡住 crawler 交付

### 2. 引入显式的 site2 transport 抽象，而不是把 `curl_cffi` 调用散落在 `session.py` 和 `client.py`

**选择**：新增一个轻量 transport 辅助层，负责统一处理：
- session 创建与关闭
- proxies / headers / cookies 注入
- GET 请求发送
- JSON / bytes 响应读取
- transport 级错误归类

`session.py` 和 `client.py` 只消费这层抽象，不直接绑具体 HTTP 库。

**理由**：如果只把 `requests.get(...)` 逐个替换成 `curl_cffi.requests.get(...)`，调用点仍然会散落，后续 fallback、测试 mock、错误分类和会话复用都会更难收敛。单独的 transport 辅助层可以把本次 change 控制在“换传输引擎而不改业务层”。

**替代方案：**
- **原地替换每个调用点**：改动看起来更少，但维护上最容易再次分裂

### 3. `create_session()` 返回逻辑会话对象，而不是要求底层一定是 `requests.Session`

**选择**：把当前会话模型升级为库无关的逻辑会话，至少包含：
- `http` 或等价的 transport session
- `headers`
- `cookies`
- `proxies`
- `verify_code`
- `created_at`

业务层通过统一接口读写这些字段，而不是假设它是 `requests.Session`。

**理由**：现有 spec 和实现里把“会话”与 `requests.Session` 绑定得过紧，导致 transport 替换时到处受限。把它提升为逻辑会话后，`ensure_fresh()`、cookie 注入、session bootstrap、验证码复用仍能成立，但不再受具体 HTTP 库限制。

**替代方案：**
- **继续把 session 定义成第三方库的原生对象**：切换 transport 时会再次触发同类耦合

### 4. 保持现有错误语义，但把 transport 级错误识别扩展到新客户端

**选择**：继续沿用 site2 现有的“代理错误触发 session/IP 轮换、非代理错误按退避重试”的行为，但更新错误分类，使其覆盖 `curl_cffi` 抛出的异常类型和消息模式。

**理由**：切换 transport 不应该改变 crawler 的恢复策略。当前窗口处理、重试与会话轮换逻辑已经被 acceptance change 验证过，最稳妥的方案是保留这些上层语义，只替换底层错误映射。

**替代方案：**
- **同时重写 transport 和重试策略**：风险过高，定位失败原因会更难

## Risks / Trade-offs

- **[新依赖引入] `curl_cffi` 在不同环境的安装可用性不一致** → 在实现中补充依赖说明，并保留单元测试覆盖 transport 入口
- **[会话抽象变更] 现有代码中默认把 session 当成 `requests.Session` 使用** → 先梳理 `session.py`、`client.py`、`tasks/core.py` 的访问面，只暴露必要字段和方法
- **[行为差异] `curl_cffi` 与 `requests` 的 cookie/重定向细节可能不同** → 用验证码、列表、详情三层 smoke test 覆盖核心行为
- **[性能权衡] 统一 transport 后并发 detail 的吞吐可能与当前实现不同** → 先保留现有 worker 数，观察真实代理环境表现，再决定是否调并发
- **[供应商侧变化] 代理平台后续可能修复 `requests` 兼容性** → 本次设计以“当前可运行”为目标，不阻止后续再评估是否切回更通用的客户端

## Migration Plan

1. 引入 `curl_cffi` transport 层，并在不改任务入口的前提下完成 session/bootstrap 调用链迁移
2. 将验证码、`probe_total`、`fetch_list`、`fetch_detail` 统一切到新 transport
3. 更新单元测试，覆盖 transport 层 mock、验证码抓取、代理错误分类和 session bootstrap
4. 在真实网络环境下先跑 `create_session()` 和 1 天只读 `reconcile`
5. 若 smoke test 通过，再跑小窗口 `backfill` / `incremental`
6. 回归到原 acceptance change，继续推进 `stabilize-site2-crawler-pipeline` 的未完成验收任务

回滚策略：若 `curl_cffi` 在真实链路里未达到预期，可回退到当前混合实现（验证码 shell `curl` + 其余 `requests`），以保留已经验证过的 captcha workaround。

## Open Questions

- 是否需要在第一版里就移除 shell `curl` 验证码路径，还是先保留为 fallback
- `httpx` 是否值得作为第二传输后备，还是保持设计只支持单一主传输层
- detail 并发在 `curl_cffi` 下是否需要比当前更保守，以避免代理资源瞬时抖动
