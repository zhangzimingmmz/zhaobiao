# Tasks: site1-crawler-and-ui

## 1. SITE1 爬虫 — 配置与客户端

- [ ] 1.1 在 `crawler/site1/config.py` 中实现配置模块：主接口 URL、请求头、三类 categorynum 与 condition、请求体模板、rn=12、安全阈值 360、站点 ID site1_sc_ggzyjy、重试次数与退避
- [ ] 1.2 在 `crawler/site1/client.py` 中实现主接口请求：probe_total(category_id, start_time, end_time) 与 fetch_page(..., pn, rn)，含重试与超时，依赖 config

## 2. SITE1 爬虫 — 存储与时间窗口

- [ ] 2.1 在 `crawler/site1/storage.py` 中实现以 (site, id) 为唯一键的 upsert，仅保留 SITE1_CRAWLER_LOGIC 规定字段及 first_seen_at/last_seen_at
- [ ] 2.2 在 `crawler/site1/windowing.py` 中实现 daily_windows、split_window_to_smaller、previous_two_hour_window、last_48h_windows，依赖 config

## 3. SITE1 爬虫 — 任务入口

- [ ] 3.1 在 `crawler/site1/tasks/backfill.py` 中实现初始化任务：按分类与日窗口探测、超阈值拆窗、分页抓取并调用 storage.save_records
- [ ] 3.2 在 `crawler/site1/tasks/incremental.py` 中实现增量任务：计算上一 2 小时窗口，三类分别抓取并落库
- [ ] 3.3 在 `crawler/site1/tasks/recovery.py` 中实现补偿任务：最近 48 小时窗口，与 incremental 共用抓取与落库逻辑

## 4. 公告数据 API

- [ ] 4.1 新增公告列表接口：分页 (page, pageSize)、可选筛选 (categorynum、时间范围、tradingsourcevalue)，响应与 DATA_STRUCTURE / BidListItem 对齐
- [ ] 4.2 新增公告详情接口：按 id 查询单条，响应与 BidDetailItem 对齐，不存在返回 404
- [ ] 4.3 确保 API 从 SITE1 爬虫所用同一存储读取，字段名与类型与 UI 契约一致

## 5. UI 数据源切换

- [ ] 5.1 抽象前端数据层：如 api/notices 或 hooks，请求列表与详情，API base URL 可配置（环境变量或配置）
- [ ] 5.2 首页 Home 从 Mock 切换为调用列表 API，增加加载态与错误态及重试
- [ ] 5.3 详情页 Detail 从 Mock 切换为根据路由 id 调用详情 API，增加加载态与 404/错误态及重试
- [ ] 5.4 保留通过配置或开关切回 Mock 的能力，便于无后端开发
