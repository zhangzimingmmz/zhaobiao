## Context

网站一爬虫（`crawler/site1/`）已实现，模块化为 config、client、windowing 和 tasks（backfill/incremental/recovery），数据写入 `notices` 统一存储表。网站二（ccgp-sichuan.gov.cn）API 体系完全不同：REST V2 接口，需要动态签名头（RSA + SHA1+MD5）、4 位数字验证码、Cookie 会话管理。通过逆向前端 JS 已完全破解签名算法。

现有基础设施（storage、API 层、数据库 schema）已兼容网站二字段，无需修改。

## Goals / Non-Goals

**Goals:**
- 实现网站二两类公告的完整采集：采购公告（noticeType=00101）、采购意向公开（noticeType=59）
- 复用 site1 的模块化架构（config/client/session/windowing/tasks）
- 签名头自动生成，验证码自动 OCR 识别
- 支持 backfill、incremental、recovery 三类任务
- 所有数据写入已有 `notices` 表，site 标识为 `site2_ccgp_sichuan`

**Non-Goals:**
- 不爬取其他公告类型（监督检查等）
- 不做 DOM 渲染 / content 字段解析
- 不修改已有数据库 schema 和 API 层
- 不做反爬对抗的高级策略（IP 代理池等）

## Decisions

### 1. 签名生成纯 Python 实现（不用 Playwright）

**选择**：逆向 JS 签名算法，用 `pycryptodome` 实现 RSA 加密，`hashlib` 实现 SHA1+MD5。

**理由**：签名算法已完全破解（`nsssjss = RSA(url_no_params + "$$" + timestamp)`, `sign = MD5(SHA1(timestamp + "_" + url + "_bosssoft_platform_095285"))`）。纯 Python 无需浏览器进程，速度快、资源开销小。

**替代方案**：Playwright 拦截浏览器请求提取签名头 —— 资源开销大、速度慢，适合签名无法逆向的场景。

### 2. 验证码用 ddddocr 本地 OCR

**选择**：使用 `ddddocr` 开源库本地识别 4 位数字验证码。

**理由**：免费、无网络依赖、对简单数字验证码识别率 > 90%。识别失败可自动重试（重新获取验证码图片）。

**替代方案**：在线打码平台（准确率更高但有费用和延迟）、手动输入（不可自动化）。

### 3. 会话管理用 requests.Session

**选择**：每次采集任务创建新 `requests.Session`，先 `getVerify` 获取验证码（同时绑定 Cookie），OCR 识别后复用同一 Session 发送后续请求。

**理由**：网站二的 `axios.defaults.withCredentials = true`，验证码与 Cookie 绑定。`requests.Session` 自动维护 Cookie，够用且简单。

### 4. 分页模型：page-based 而非 offset-based

**选择**：网站二使用 `currPage` + `pageSize` 分页（不同于 site1 的 pn/rn offset 分页）。client 的 `fetch_page` 参数改为 `(currPage, pageSize)` 形式。

### 5. 详情接口分两种

**选择**：采购公告详情用 `selectInfoByOpenTenderCode`（需 `planId` + `id`），采购意向用 `getInfoById`（只需 `id`）。client 根据 noticeType 分发。

### 6. 时间窗口逻辑复用 site1

**选择**：复用 `crawler/site1/windowing.py` 的 `daily_windows`、`previous_two_hour_window`、`last_48h_windows` 等函数，若需调整（如窗口阈值）通过 config 参数化。

## Risks / Trade-offs

- **验证码识别率不足** → 自动重试机制（最多 3 次获取新验证码），失败则 log 告警跳过该批次
- **RSA 公钥可能更新** → 公钥存储在 config 中，更新时只需修改 config.py
- **签名算法可能变更** → JS 代码有版本标识（V6.5.14.0），需监控网站 JS 更新
- **Cookie 过期** → 每批次任务重新建立 Session，不长期持有
- **网站二 API 频率限制** → 请求间添加随机延迟（1-3 秒）
