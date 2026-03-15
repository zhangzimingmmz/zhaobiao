## 1. 配置与依赖

- [x] 1.1 添加 `ddddocr` 和 `pycryptodome` 到项目依赖
- [x] 1.2 创建 `crawler/site2/__init__.py`
- [x] 1.3 创建 `crawler/site2/config.py`：定义 API URL、RSA 公钥、签名盐值、noticeType 映射、分页默认值、站点标识、重试参数

## 2. 签名与会话

- [x] 2.1 创建 `crawler/site2/session.py`：实现 `generate_sign_headers(url)` — RSA 加密生成 nsssjss，SHA1+MD5 生成 sign
- [x] 2.2 实现 `solve_captcha(session)` — 调用 getVerify 获取验证码图片，ddddocr 识别，失败自动重试
- [x] 2.3 实现 `create_session()` — 创建 requests.Session，设置固定 Cookie，自动获取并识别验证码，返回可用会话

## 3. HTTP 客户端

- [x] 3.1 创建 `crawler/site2/client.py`：实现 `fetch_list(session, notice_type, start_time, end_time, curr_page, page_size)` — 列表接口请求
- [x] 3.2 实现 `probe_total(session, notice_type, start_time, end_time)` — 探测单窗口总条数
- [x] 3.3 实现 `fetch_detail(session, notice_type, record)` — 根据 noticeType 分发到不同详情接口

## 4. 时间窗口

- [x] 4.1 确认 `crawler/site1/windowing.py` 可复用，如需参数化则提取到公共模块或在 site2 config 中配置窗口阈值

## 5. 任务模块

- [x] 5.1 创建 `crawler/site2/tasks/__init__.py`
- [x] 5.2 创建 `crawler/site2/tasks/backfill.py`：按日窗口遍历两类公告，probe → split → 分页拉列表 → 拉详情 → 合并落库
- [x] 5.3 创建 `crawler/site2/tasks/incremental.py`：上一 2h 窗口，两类公告分页拉取并落库
- [x] 5.4 创建 `crawler/site2/tasks/recovery.py`：最近 48h 窗口序列，遍历拉取并落库，依赖 storage 去重

## 6. 验证

- [x] 6.1 手动运行 backfill 单日单类验证数据落库正确性（已验证：2026-03-13 抓取 59 类型 330 条，字段完整）
- [x] 6.2 检查 notices 表中 site2_ccgp_sichuan 记录字段映射是否正确（category_num、region_name、title 均正常落库）

## 已修复问题

- **[4009] Signature Verification Failed**（已修复）:
    - Root Cause: `fetch_list` 构建的 query string 缺少 `siteId`、`channel`、`_t`，且多余了 `regionCode`，导致服务端签名验证失败。
    - Fix: 按浏览器抓包顺序重排参数，加入 `config.SITE_UUID`、`config.CHANNEL_UUID`、动态时间戳 `_t`。
- **[4001] 请求方式不对**（已修复）：详情接口由 POST 改为 GET，并正确携带 `_t` 和签名头。
- **storage.upsert_records 调用签名错误**（已修复）：backfill 改为传入 `conn`、`records`、`config.SITE_ID`。
- **代理 IP 短效过期**（已缓解）：详情请求失败时自动重建 session，列表空返回时也自动重建并重试。
