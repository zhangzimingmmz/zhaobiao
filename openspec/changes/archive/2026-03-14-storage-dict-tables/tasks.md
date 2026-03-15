# Tasks: storage-dict-tables

## 1. 文档补充

- [x] 1.1 在 docs/存储表结构说明.md 中新增「公告单表设计理由」小节：说明为何采用一张 notices 表而非一类型一张表（统一列表 API、字段重叠、扩展方式），以及多类型数据结构差异如何容纳（公共列、类型专属可空列、raw_json）
- [x] 1.2 在同一文档中新增「字典表」小节：表名（dict_region、dict_purchase_manner、dict_notice_category）、列定义、数据来源、与 notices 的关联方式（region_code、purchase_manner、category_num）

## 2. 字典表建表与迁移

- [x] 2.1 在 crawler/migrations 下新增 002_create_dict_*.sql（或单文件 002_create_dict_tables.sql），创建 dict_region、dict_purchase_manner、dict_notice_category 表及唯一键/索引
- [x] 2.2 为 dict_notice_category 提供初始数据（INSERT 网站一/网站二当前使用的 category_num 与展示名称），与《接口文档-前端与小程序》category 取值一致

## 3. 字典数据 API

- [x] 3.1 在 server 中新增 GET /api/dict/regions、/api/dict/purchase-manner、/api/dict/categories（或统一 /api/dict?type=...），从对应字典表读取并返回编码与名称列表
