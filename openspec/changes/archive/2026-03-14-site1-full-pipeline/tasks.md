# Tasks: 网站一全链路打通

## 1. 爬虫 config 模块

- [x] 1.1 创建 crawler/site1/config.py，定义主接口 URL、请求头模板、三类 condition、分页 rn、阈值 360、site 标识、重试参数
- [x] 1.2 验证 client 可 from config import 获取常量且无硬编码

## 2. 爬虫 client 模块

- [x] 2.1 实现 probe_total(category_id, start_time, end_time)，发送 pn=0 rn=1，返回 totalcount
- [x] 2.2 实现 fetch_page(category_id, start_time, end_time, pn, rn)，返回 { totalcount, records }
- [x] 2.3 添加重试与超时逻辑
- [x] 2.4 验收：任一类、已知有数据的时间窗口，能拿到 totalcount 和 records

## 3. 爬虫 windowing 模块

- [x] 3.1 实现 daily_windows(start_date, end_date) 按天切片
- [x] 3.2 实现 previous_two_hour_window(now) 返回上一完整 2 小时窗口
- [x] 3.3 实现 last_48h_windows(now) 返回最近 48 小时窗口序列
- [x] 3.4 实现 split_window_to_smaller(start, end) 拆窗逻辑
- [x] 3.5 验收：给定 now，窗口计算与文档示例一致

## 4. 爬虫 backfill 任务

- [x] 4.1 实现 backfill CLI，支持 --start --end --category 参数
- [x] 4.2 对每类用 daily_windows 生成窗口，probe_total 后按阈值拆窗或分页拉取
- [x] 4.3 每页调用 storage.upsert_records 落库
- [x] 4.4 验收：指定 1 天 1 类，完整跑通且落库条数正确

## 5. 爬虫 incremental 与 recovery 任务

- [x] 5.1 实现 incremental CLI，用 previous_two_hour_window 抓取上一 2h 窗口
- [x] 5.2 实现 recovery CLI，用 last_48h_windows 抓取最近 48h
- [x] 5.3 验收：incremental 与 recovery 可单独运行且落库正确

## 6. 公告 API 服务

- [x] 6.1 创建 FastAPI 应用，配置 SQLite 连接（复用 crawler storage 的 DB 路径）
- [x] 6.2 实现 GET /api/list，支持 page、pageSize、category、timeStart、timeEnd、regionCode 等筛选
- [x] 6.3 实现 GET /api/detail/bid/:id，按 id 查询 notices 并返回详情
- [x] 6.4 响应字段与《接口文档-前端与小程序》1.4、2.4 对齐，含 categoryName 映射
- [x] 6.5 验收：curl 验证列表分页与详情接口

## 7. 前端 API 绑定

- [x] 7.1 添加 VITE_API_BASE 环境变量，默认 http://localhost:8000
- [x] 7.2 创建 api/notices 或 hooks/useNotices，封装 /api/list 与 /api/detail/bid/:id 请求
- [x] 7.3 首页列表从 Mock 切换为调用 API，处理加载与错误态
- [x] 7.4 招投标详情页从 Mock 切换为调用 API，处理加载与错误态
- [x] 7.5 验收：本地启动 API + 爬虫落库后，UI 展示真实数据
