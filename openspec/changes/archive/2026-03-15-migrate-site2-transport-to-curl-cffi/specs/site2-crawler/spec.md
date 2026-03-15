## ADDED Requirements

### Requirement: 爬虫在代理环境下使用统一的 curl-compatible transport

系统 SHALL 为网站二所有经代理访问四川采购网 HTTPS 接口的请求提供统一的 curl-compatible transport 实现。验证码、列表探测、分页列表和详情请求 MUST 通过同一类 transport 发起，而不能长期拆分为“部分接口走 curl、部分接口走 requests”的并行主路径。

#### Scenario: 验证码与列表使用同一类 transport
- **WHEN** 系统在代理环境下依次执行 getVerify、probe_total 和 fetch_list
- **THEN** 这些请求 MUST 使用同一类 curl-compatible transport
- **AND** 该 transport MUST 能访问 `www.ccgp-sichuan.gov.cn` 的 HTTPS 接口

#### Scenario: transport 替换不影响上层任务入口
- **WHEN** backfill、incremental、recovery 或 reconcile 调用 site2 client/session 能力
- **THEN** 任务入口 MUST 保持可调用
- **AND** 上层窗口调度与落库逻辑 MUST 无需感知底层 HTTP 库细节

## MODIFIED Requirements

### Requirement: 爬虫可自动识别验证码

系统 SHALL 提供 `crawler/site2/session.py` 中的验证码处理功能：调用 `getVerify` 接口获取验证码图片字节，使用 ddddocr 库识别 4 位数字验证码文本。验证码请求 MUST 与后续列表请求共享同一个逻辑会话的 Cookie、代理和请求头上下文，但不再要求必须使用同一个 `requests.Session` 实例。识别失败时 SHALL 自动重试（最多 3 次），每次重新获取新的验证码图片。

#### Scenario: 验证码识别成功

- **WHEN** 调用 getVerify 获取验证码图片并 OCR 识别
- **THEN** 返回 4 位数字字符串
- **AND** 逻辑会话中保留了与该验证码绑定的 Cookie、代理和请求头上下文

#### Scenario: 验证码识别失败自动重试

- **WHEN** 第一次 OCR 识别结果为空或非 4 位数字
- **THEN** 自动重新获取验证码图片并重试，最多 3 次
- **AND** 全部失败则抛出异常

### Requirement: 爬虫可创建带签名的会话

系统 SHALL 提供 `crawler/site2/session.py` 中的 `create_session()` 函数，返回一个可用于后续请求的逻辑会话对象，该对象包含：已设置固定 Cookie（`regionCode=510001`、`regionFullName=四川省`、`regionRemark=1`）、代理配置、请求头上下文、已通过 OCR 识别的 `verifyCode` 和创建时间戳。每次创建会话时 MUST 自动完成验证码获取和识别，但不再要求返回值必须是 `requests.Session`。

#### Scenario: 创建会话后可直接发请求

- **WHEN** 调用 create_session()
- **THEN** 返回的逻辑会话对象包含有效的 Cookie、代理和 verifyCode
- **AND** 该对象可直接用于后续列表和详情请求

### Requirement: 爬虫可分页拉取网站二列表

系统 SHALL 提供 `crawler/site2/client.py` 中的 `fetch_list(session, notice_type, start_time, end_time, curr_page, page_size)` 函数，向列表接口发送 GET 请求，携带签名头和验证码参数，返回 `{ total, rows }` 结构。请求参数 MUST 包含 `noticeType`、`operationStartTime`、`operationEndTime`、`currPage`、`pageSize`、`verifyCode`。请求头 MUST 附加 `nsssjss`、`sign`、`time` 签名。列表请求 MUST 复用当前逻辑会话的 Cookie、代理和 transport，而不能重新退回到与验证码不同的主传输实现。

#### Scenario: 列表请求返回数据

- **WHEN** 调用 fetch_list 且该时间窗口有数据
- **THEN** 返回 total 为正整数，rows 为公告数组

#### Scenario: 列表请求空窗口返回 0

- **WHEN** 调用 fetch_list 且该时间窗口无数据
- **THEN** 返回 total 为 0，rows 为空数组

### Requirement: 爬虫可探测网站二单窗口总条数

系统 SHALL 提供 `crawler/site2/client.py` 中的 `probe_total(session, notice_type, start_time, end_time)` 函数，发送 `currPage=1`、`pageSize=1` 的探测请求，返回 total 数值。探测请求 MUST 与正式列表请求共享同一类 transport、代理和 Cookie 上下文，避免 probe 与正式抓取走不同链路。

#### Scenario: 探测有数据窗口返回总数

- **WHEN** 调用 probe_total 且该时间窗口有数据
- **THEN** 返回正整数

#### Scenario: 探测空窗口返回 0

- **WHEN** 调用 probe_total 且该时间窗口无数据
- **THEN** 返回 0

### Requirement: 爬虫可拉取网站二详情

系统 SHALL 提供 `crawler/site2/client.py` 中的 `fetch_detail(session, notice_type, record)` 函数：
- 当 notice_type 为采购公告（`00101`）时，调用 `selectInfoByOpenTenderCode` 接口
- 当 notice_type 为采购意向（`59`）时，调用 `getInfoById` 接口

返回详情数据（含 content 等列表接口不提供的字段）。请求 MUST 携带签名头，并 MUST 复用当前逻辑会话的 transport、Cookie 和代理配置。

#### Scenario: 采购公告详情返回完整数据

- **WHEN** 对 noticeType=00101 的记录调用 fetch_detail
- **THEN** 返回包含 content、budget、purchaseManner 等详情字段的数据

#### Scenario: 采购意向详情返回完整数据

- **WHEN** 对 noticeType=59 的记录调用 fetch_detail
- **THEN** 返回包含 content、noticeTypeName 等详情字段的数据
