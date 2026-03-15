# 公告 API 服务

从统一表 `notices` 读取数据，提供列表与详情接口，字段与《接口文档-前端与小程序》一致。

## 依赖

```bash
pip install -r server/requirements.txt
```

## 运行

在**项目根目录**执行（以便正确加载 `crawler.storage`）：

```bash
# 使用默认数据库 data/notices.db
PYTHONPATH=. uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

# 或指定数据库路径
NOTICES_DB=/path/to/notices.db PYTHONPATH=. uvicorn server.main:app --reload
```

## 接口

- `GET /api/list` — 列表（page, pageSize, category, keyword, timeStart, timeEnd, regionCode）
- `GET /api/detail/bid/{id}` — 招投标详情
- `GET /api/detail/info/{id}` — 信息展示详情

数据库主文档见 `docs/数据库表设计.md`，补充说明见 `docs/supplemental/存储表结构说明.md`。相关表由爬虫写入、本服务只读。
