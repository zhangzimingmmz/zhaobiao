# Tasks: crawler-data-storage

## 1. 表结构与映射文档

- [x] 1.1 在 crawler 或 docs 下新增《存储表结构说明》文档：表名（notices 或 notices_site1/notices_site2）、唯一键 (site, id)、列名与类型（与《原始数据接口文档》落库字段并集及 first_seen_at/last_seen_at/raw_json），并注明可空与索引建议
- [x] 1.2 在同一文档或单独《存储→API 字段映射表》中列出存储列与《接口文档-前端与小程序》列表/详情字段的对应（如 webdate/noticeTime → publishTime，zhuanzai/author → sourceName，linkurl + baseUrl → originUrl），供 API 与 VIEW 实现参照

## 2. 实现阶段（可选，按需执行）

- [x] 2.1 按 1.1 表结构在项目中编写建表 SQL 或迁移脚本（SQLite/PostgreSQL 等），并放入版本管理
- [x] 2.2 实现或调整爬虫 storage 模块：以 (site, id) 做 upsert，写入 1.1 约定字段及 raw_json（若保留）
- [x] 2.3 实现或调整公告列表/详情 API：从公告表（或基于该表的 VIEW）读取，按 1.2 映射表返回《接口文档-前端与小程序》约定字段
