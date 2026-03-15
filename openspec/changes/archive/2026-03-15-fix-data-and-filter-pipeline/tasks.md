## 1. S-code 映射修正（P1）

- [x] 1.1 按 design 中的实际映射表修正 server/main.py 的 _S_TO_REGION（S014→遂宁、S008→眉山、S015→广安 等）
- [x] 1.2 验证：请求 regionCode=511600、source=510900 分别返回广安、遂宁数据

## 2. purchase_nature 存储（P3）

- [x] 2.1 新增 migration：ALTER TABLE notices ADD COLUMN purchase_nature TEXT
- [x] 2.2 在 storage NOTICES_COLUMNS 与 _row_to_tuple 中增加 purchase_nature
- [x] 2.3 在 site2 tasks/core.py 的 mapped_record 中增加 purchase_nature: row.get("purchaseNature") or detail.get("purchaseNature")

## 3. purchaseNature API 与前端（P3）

- [x] 3.1 在 /api/list 中新增 purchaseNature 参数，SQL 条件 purchase_nature = ?
- [x] 3.2 在 index.tsx buildParams 中增加 purchaseNature: filterValues.nature?.code || undefined
- [x] 3.3 验证：选「货物」后请求含 purchaseNature=1，返回结果仅含货物类

## 4. 002002001 说明（P2/P4）

- [x] 4.1 在接口文档或 API 注释中说明：category=002002001 时 tradingsourcevalue 多为空，source 筛选可能无结果
