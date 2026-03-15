-- 字典表：地区、采购方式、公告分类
-- 依据 docs/数据库表设计.md（openspec/changes/full-schema-spec/design.md）
-- SQLite 语法

-- 地区字典表
CREATE TABLE IF NOT EXISTS dict_region (
  region_code TEXT NOT NULL PRIMARY KEY,
  region_full_name TEXT,
  parent_id TEXT,
  is_leaf TEXT,
  sort_order INTEGER,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_dict_region_parent ON dict_region (parent_id);

-- 采购方式字典表
CREATE TABLE IF NOT EXISTS dict_purchase_manner (
  dict_code TEXT NOT NULL PRIMARY KEY,
  dict_name TEXT,
  dict_type TEXT,
  sort_order INTEGER,
  updated_at TEXT
);

-- 公告分类字典表
CREATE TABLE IF NOT EXISTS dict_notice_category (
  category_num TEXT NOT NULL PRIMARY KEY,
  category_name TEXT,
  site_hint TEXT,
  sort_order INTEGER,
  updated_at TEXT
);

-- 初始数据：公告分类（与《接口文档-前端与小程序》category 取值一致）
INSERT OR IGNORE INTO dict_notice_category (category_num, category_name, sort_order) VALUES
  ('002001009', '招标计划', 1),
  ('002001001', '招标公告', 2),
  ('002002001', '政府采购采购公告', 3),
  ('59', '采购意向公开', 4),
  ('00101', '采购公告', 5);
