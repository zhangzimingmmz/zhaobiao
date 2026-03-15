# Tasks: full-schema-spec

## 1. 完整表设计文档

- [x] 1.1 在 docs 下新增《数据库表设计》文档（或合并进《存储表结构说明》并重命名），包含**表清单**：列出 notices、dict_region、dict_purchase_manner、dict_notice_category 四张表及每表一行用途简述
- [x] 1.2 在同一文档中为**每张表**分别写出**用途说明**（存什么、谁写谁读、关联 API/业务）与**完整字段定义表**（列名、类型、可空、说明），与 openspec/changes/full-schema-spec/design.md 一致并可追溯

## 2. 与 migrations 对齐

- [x] 2.1 核对 crawler/migrations/001_create_notices.sql 与表设计文档中 notices 的字段定义一致；若有差异以文档为准并更新 001 或补充说明
- [x] 2.2 若尚未存在字典表建表 SQL，按表设计文档新增 crawler/migrations/002_create_dict_tables.sql，创建 dict_region、dict_purchase_manner、dict_notice_category 及主键/索引；若已存在则核对与文档一致
