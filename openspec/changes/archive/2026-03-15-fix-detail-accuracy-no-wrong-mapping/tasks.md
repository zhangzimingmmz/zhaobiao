# Tasks: 详情页准确优先，禁止错误映射

## 1. 后端 tenderer 过滤

- [x] 1.1 在 server/main.py 中定义平台名集合（如 `PLATFORM_NAMES = {"四川政府采购网", "四川省政府采购网"}`）
- [x] 1.2 在 `_row_detail_bid` 中：计算 `tenderer = row["purchaser"] or row["source_name"]` 后，若 `tenderer in PLATFORM_NAMES`，则 `tenderer = None`

## 2. 小程序按钮对齐

- [x] 2.1 在 `pages/detail/index.scss` 的 `detail-card__action` 中增加 `box-sizing: border-box` 与 `max-width: 100%`
- [x] 2.2 在 `pages/info-detail/index.scss` 的 `info-detail__head-action` 中同样增加上述样式
