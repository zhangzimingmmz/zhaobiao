# Spec: full-schema-doc

## ADDED Requirements

### Requirement: 表清单

系统 SHALL 提供并维护一份**表设计文档**（或等价规范），其中 SHALL 包含**表清单**：列出系统内所有业务表名称，且与当前实际建表（migrations）一致。表清单 SHALL 作为「有哪些表」的单一依据，便于实现与验收核对。

#### Scenario: 可从文档得到全部表名

- **WHEN** 开发或验收人员查阅表设计文档
- **THEN** 文档中 SHALL 明确列出所有表名（如 notices、dict_region、dict_purchase_manner、dict_notice_category），无遗漏且无多余未建表

#### Scenario: 表清单与 migrations 一致

- **WHEN** 存在建表 SQL（如 crawler/migrations/*.sql）
- **THEN** 表设计文档中的表清单 SHALL 与 migrations 中 CREATE TABLE 的表名集合一致（或文档为权威，migrations 按文档补全）

---

### Requirement: 每张表的用途说明

对表清单中的**每一张表**，表设计文档 SHALL 提供该表的**用途说明**：该表存储什么数据、由谁写入、由谁读取、与哪些 API 或业务场景对应。每张表 MUST 具备明确的用途描述，以便理解「这张表是干什么的」。

#### Scenario: 每表均有用途描述

- **WHEN** 查阅表设计文档中任意一张表
- **THEN** 该表 SHALL 有独立的「用途」或「说明」段落/表格项，描述存储内容、读写方、关联业务或 API

#### Scenario: 公告表与字典表用途可区分

- **WHEN** 查阅 notices 与任意字典表（如 dict_region）
- **THEN** 文档 SHALL 能区分：notices 为公告主数据、爬虫写入与列表/详情 API 读取；字典表为选项与展示名称、爬虫或配置写入与 /api/dict/* 或筛选逻辑读取

---

### Requirement: 每张表的完整字段定义

对表清单中的**每一张表**，表设计文档 SHALL 提供该表的**完整字段定义**：列名、类型、可空性、说明（及可选：来源/约束）。每张表 MUST 具备完整列定义表或等价结构，不得缺列或仅用文字含糊描述，以便实现建表与 API 映射有据可查。

#### Scenario: 每表均有完整列定义

- **WHEN** 查阅表设计文档中任意一张表
- **THEN** 该表 SHALL 有字段定义表或列表，包含至少列名、类型、可空、说明，且覆盖该表所有业务列（不含仅实现细节的隐藏列时可单独说明）

#### Scenario: 公告表字段与现有契约一致

- **WHEN** 对照《原始数据接口文档》落库建议与《接口文档-前端与小程序》列表/详情字段
- **THEN** notices 的字段定义 SHALL 能支撑爬虫落库与 API 映射，列名与类型与现有 001_create_notices.sql 及存储表结构说明一致或已同步更新

#### Scenario: 字典表字段可支撑筛选与展示

- **WHEN** 实现 /api/dict/regions、/api/dict/purchase-manner、/api/dict/categories 或列表 categoryName/regionName 解析
- **THEN** dict_region、dict_purchase_manner、dict_notice_category 的字段定义 SHALL 包含编码列与名称列，且唯一键明确，可被 notices 引用或 JOIN
