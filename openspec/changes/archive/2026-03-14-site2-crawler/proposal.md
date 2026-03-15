## Why

网站一（ggzyjy.sc.gov.cn）爬虫已完整实现并落库，但网站二（ccgp-sichuan.gov.cn —— 四川政府采购网）的采购公告和采购意向公开数据尚未采集。网站二拥有独立的 API 体系（REST V2）、签名鉴权机制、验证码校验和分页模型，需要新建一套爬虫模块完成数据采集并写入已有的 `notices` 统一存储表。

## What Changes

- 新增 `crawler/site2/` 模块，包含 config、client（列表与详情 HTTP 客户端）、session（签名生成 + 验证码识别 + Cookie 管理）及 windowing 逻辑
- 新增三类定时任务（backfill 初始化、incremental 增量、recovery 补偿），结构与 site1 一致
- 签名头实现：RSA 加密生成 `nsssjss`，SHA1+MD5 生成 `sign`，自动附加 `time` 时间戳
- 验证码模块：调用 `getVerify` 获取 4 位数字验证码图片，使用 ddddocr 本地 OCR 识别
- 会话管理：使用 `requests.Session` 维持 Cookie 与验证码绑定
- 所有采集数据写入已有 `notices` 表，site 标识为 `site2_ccgp_sichuan`，复用 `crawler/storage.py` 的 `upsert_records`

## Capabilities

### New Capabilities
- `site2-crawler`: 网站二爬虫核心模块，覆盖配置、签名鉴权、验证码识别、HTTP 客户端、分页采集、时间窗口、backfill/incremental/recovery 三类任务

### Modified Capabilities
（无需修改已有 spec 的需求层行为，存储表和 API 层已兼容网站二字段）

## Impact

- **新增代码**：`crawler/site2/` 目录（config.py、client.py、session.py、tasks/backfill.py、tasks/incremental.py、tasks/recovery.py）
- **新增依赖**：`ddddocr`（验证码 OCR）、`pycryptodome`（RSA 加密）
- **复用模块**：`crawler/storage.py`（upsert_records）、`crawler/site1/windowing.py`（时间窗口逻辑可复用或适配）
- **数据库**：无 schema 变更，`notices` 表已包含网站二所需字段
- **API 层**：无变更，`server/main.py` 列表/详情映射已兼容网站二字段

## Current Status (2026-03-14)

### Accomplishments
- **Proxy Integration**: Successfully integrated **Qingguo Short-term Elastic Proxy** to bypass IP blocking (WAF).
- **Core Logic**: RSA/MD5 signature, CAPTCHA solving (ddddocr), and database upsertion are fully implemented.
- **Dynamic Session**: `create_session` automatically fetches and rotates proxy IPs.

### Unresolved Issues
- **Error 4009 (Signature Invalid)**: The List API returns `4009` when using `GET`. Investigation shows the signature calculation approach for query parameters in the Bosssoft platform is highly specific and might involve sorting/escaping that needs further JS reverse engineering.
