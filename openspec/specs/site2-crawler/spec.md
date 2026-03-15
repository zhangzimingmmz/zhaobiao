# Spec: site2-crawler

## ADDED Requirements

### Requirement: 爬虫可配置网站二采集参数

系统 SHALL 提供 `crawler/site2/config.py` 模块，集中存放：网站二 API 基础 URL（`https://www.ccgp-sichuan.gov.cn/gpcms`）、列表接口路径（`/rest/web/v2/info/selectInfoForIndex`）、详情接口路径（采购公告 `/rest/web/v2/index/selectInfoByOpenTenderCode`、采购意向 `/rest/web/v2/info/getInfoById`）、验证码接口路径（`/rest/web/v2/index/getVerify`）、RSA 公钥、签名盐值（`bosssoft_platform_095285`）、两类公告的 noticeType（`00101`、`59`）、分页参数默认值（pageSize=10）、时间窗口阈值（MAX_WINDOW_COUNT=360）、站点标识 `site2_ccgp_sichuan`、重试次数与退避基数、请求间随机延迟范围。其他模块 MUST 通过 import config 获取上述常量。

#### Scenario: 其他模块引用 config

- **WHEN** client 或 session 模块需要 API URL 或 RSA 公钥
- **THEN** 从 config 导入并使用，无硬编码 URL 或密钥字符串

---

### Requirement: 爬虫可自动生成签名头

系统 SHALL 提供 `crawler/site2/session.py` 中的签名生成功能，根据请求 URL 和当前时间戳生成三个签名值：
1. `time`：当前毫秒级时间戳
2. `nsssjss`：RSA 公钥加密 `url去掉问号后参数 + "$$" + time` 的结果
3. `sign`：`MD5(SHA1(time + "_" + url + "_bosssoft_platform_095285"))` 的结果

签名 MUST 使用 config 中的 RSA 公钥和盐值，不得硬编码。

#### Scenario: 签名头格式正确

- **WHEN** 给定 URL `https://example.com/api/list?page=1` 和时间戳 `1710000000000`
- **THEN** `time` 为 `1710000000000`，`nsssjss` 为 RSA 加密 `"https://example.com/api/list$$1710000000000"` 的 Base64 编码字符串，`sign` 为 `MD5(SHA1("1710000000000_https://example.com/api/list?page=1_bosssoft_platform_095285"))` 的十六进制字符串

---

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

---

### Requirement: 爬虫可自动识别验证码

系统 SHALL 提供 `crawler/site2/session.py` 中的验证码处理功能：调用 `getVerify` 接口获取验证码图片字节，使用 ddddocr 库识别 4 位数字验证码文本。验证码请求 MUST 与后续列表请求共享同一个逻辑会话的 Cookie、代理和请求头上下文，但不再要求必须使用同一个 `requests.Session` 实例。识别失败时 SHALL 自动重试（最多 3 次），每次重新获取新的验证码图片。

#### Scenario: 验证码识别成功

- **WHEN** 调用 getVerify 获取验证码图片并 OCR 识别
- **THEN** 返回 4 位数字字符串
- **AND** 逻辑会话中保留了与该验证码绑定的 Cookie、代理和请求头上下文

#### Scenario: 验证码识别失败自动重试

- **WHEN** 第一次 OCR 识别结果为空或非 4 位数字
- **THEN** 自动重新获取验证码图片并重试，最多 3 次，全部失败则抛出异常

---

### Requirement: 爬虫可创建带签名的会话

系统 SHALL 提供 `crawler/site2/session.py` 中的 `create_session()` 函数，返回一个可用于后续请求的逻辑会话对象，该对象包含：已设置固定 Cookie（`regionCode=510001`、`regionFullName=四川省`、`regionRemark=1`）、代理配置、请求头上下文、已通过 OCR 识别的 `verifyCode` 和创建时间戳。每次创建会话时 MUST 自动完成验证码获取和识别，但不再要求返回值必须是 `requests.Session`。

#### Scenario: 创建会话后可直接发请求

- **WHEN** 调用 create_session()
- **THEN** 返回的逻辑会话对象包含有效的 Cookie、代理和 verifyCode
- **AND** 该对象可直接用于后续列表和详情请求

---

### Requirement: 爬虫可分页拉取网站二列表

系统 SHALL 提供 `crawler/site2/client.py` 中的 `fetch_list(session, notice_type, start_time, end_time, curr_page, page_size)` 函数，向列表接口发送 GET 请求，携带签名头和验证码参数，返回 `{ total, rows }` 结构。请求参数 MUST 包含 `noticeType`、`operationStartTime`、`operationEndTime`、`currPage`、`pageSize`、`verifyCode`。请求头 MUST 附加 `nsssjss`、`sign`、`time` 签名。列表请求 MUST 复用当前逻辑会话的 Cookie、代理和 transport，而不能重新退回到与验证码不同的主传输实现。

#### Scenario: 列表请求返回数据

- **WHEN** 调用 fetch_list 且该时间窗口有数据
- **THEN** 返回 total 为正整数，rows 为公告数组

#### Scenario: 列表请求空窗口返回 0

- **WHEN** 调用 fetch_list 且该时间窗口无数据
- **THEN** 返回 total 为 0，rows 为空数组

---

### Requirement: 爬虫可探测网站二单窗口总条数

系统 SHALL 提供 `crawler/site2/client.py` 中的 `probe_total(session, notice_type, start_time, end_time)` 函数，发送 `currPage=1`、`pageSize=1` 的探测请求，返回 total 数值。探测请求 MUST 与正式列表请求共享同一类 transport、代理和 Cookie 上下文，避免 probe 与正式抓取走不同链路。

#### Scenario: 探测有数据窗口返回总数

- **WHEN** 调用 probe_total 且该时间窗口有数据
- **THEN** 返回正整数

#### Scenario: 探测空窗口返回 0

- **WHEN** 调用 probe_total 且该时间窗口无数据
- **THEN** 返回 0

---

### Requirement: 爬虫可拉取网站二详情

系统 SHALL 提供 `crawler/site2/client.py` 中的 `fetch_detail(session, notice_type, record)` 函数：
- 当 notice_type 为采购公告（`00101`）时，调用 `selectInfoByOpenTenderCode` 接口，传入 `openTenderCode`
- 当 notice_type 为采购意向（`59`）时，调用 `getInfoById` 接口，传入 `id`

返回详情数据（含 content 等列表接口不提供的字段）。请求 MUST 携带签名头，并 MUST 复用当前逻辑会话的 transport、Cookie 和代理配置。

#### Scenario: 采购公告详情返回完整数据

- **WHEN** 对 noticeType=00101 的记录调用 fetch_detail
- **THEN** 返回包含 content、budget、purchaseManner 等详情字段的数据

#### Scenario: 采购意向详情返回完整数据

- **WHEN** 对 noticeType=59 的记录调用 fetch_detail
- **THEN** 返回包含 content、noticeTypeName 等详情字段的数据

---

### Requirement: 爬虫可将网站二数据落库

系统 SHALL 将网站二采集的列表和详情数据通过 `crawler.storage.upsert_records` 写入 `notices` 表。字段映射 MUST 遵循：
- `id` → `id`
- `title` → `title`
- `noticeTime` → `publish_time`
- `author` → `source_name`
- `regionName` → `region_name`
- `regionCode` → `region_code`
- `noticeType` → `notice_type`
- `openTenderCode` → `open_tender_code`
- `content` → `content`

site 标识 MUST 为 `site2_ccgp_sichuan`。

#### Scenario: 网站二数据正确落库

- **WHEN** 采集一条网站二公告并落库
- **THEN** notices 表中存在 `(site2_ccgp_sichuan, id)` 记录，各字段正确映射

#### Scenario: 重复落库为更新

- **WHEN** 同一条公告落库两次
- **THEN** 第二次为更新而非重复行，`last_seen_at` 更新

---

### Requirement: 爬虫支持网站二 backfill 初始化任务

系统 SHALL 提供 `crawler/site2/tasks/backfill.py`：对两类公告（00101、59），用 `daily_windows` 生成日窗口；对每个窗口 probe_total，若 0 则跳过，若 > MAX_WINDOW_COUNT 则 split 递归；否则分页拉取列表、逐条拉详情、合并落库直到遍历完所有页。每批次任务 MUST 创建新会话（含验证码）。

#### Scenario: 指定 1 天 1 类完整跑通

- **WHEN** 执行 backfill --start 2026-03-14 --end 2026-03-14 --notice-type 00101
- **THEN** 该日该类数据完整落库，条数与 probe_total 一致

---

### Requirement: 爬虫支持网站二 incremental 增量任务

系统 SHALL 提供 `crawler/site2/tasks/incremental.py`：用 `previous_two_hour_window(now)` 得到窗口，对两类公告分别分页拉取列表、详情并落库。

#### Scenario: 指定 now 抓取上一 2h 窗口

- **WHEN** 执行 incremental
- **THEN** 上一 2 小时窗口的两类数据落库

---

### Requirement: 爬虫支持网站二 recovery 补偿任务

系统 SHALL 提供 `crawler/site2/tasks/recovery.py`：用 `last_48h_windows(now)` 得到窗口序列，对每个窗口、每类执行分页拉取与落库；storage 侧 `(site, id)` 去重。

#### Scenario: 48h 补偿去重正确

- **WHEN** 执行 recovery 两次
- **THEN** 第二次主要为更新，无重复主键

---

## Technical Implementation Details & Pitfalls

### Proxy Requirement
Due to strict WAF at `ccgp-sichuan.gov.cn`, requests MUST be routed through a domestic residential or non-IDC proxy. 
- **Service Type**: Qingguo Short-term Elastic Proxy (短效代理-弹性提取).
- **Extraction**: Code in `session.py` SHALL call `PROXY_EXTRACT_URL` to fetch a fresh `IP:Port` for each session.

### Known Issues: 4009 Signature Failure
The current implementation of `generate_sign_headers` produces a `4009` error when calling the List API via `GET`.
- **Symptoms**: Detail API (POST) works fine with the RSA encrypted path, but the List API (GET) with query params fails verification.
- **Hurdle**: The sorting, encoding, or exact path string used for the `sign` MD5 hash (SHA1 based) in the Bosssoft platform needs precise alignment with their frontend JS implementation.
- **Status**: The implementation is logically complete but requires fine-tuning of the signature string construction.
