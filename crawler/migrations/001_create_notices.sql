-- 公告统一表 notices
-- 依据 docs/存储表结构说明.md，与《原始数据接口文档》落库字段并集一致
-- SQLite 语法；PostgreSQL 可将 TEXT 保留或改为 VARCHAR，raw_json 改为 JSONB

CREATE TABLE IF NOT EXISTS notices (
  site TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT NOT NULL,
  publish_time TEXT,
  info_date TEXT,
  source_name TEXT,
  tradingsourcevalue TEXT,
  region_name TEXT,
  region_code TEXT,
  category_num TEXT,
  channel TEXT,
  linkurl TEXT,
  origin_url TEXT,
  content TEXT,
  description TEXT,
  open_tender_code TEXT,
  plan_id TEXT,
  budget TEXT,
  purchase_manner TEXT,
  open_tender_time TEXT,
  purchaser TEXT,
  agency TEXT,
  first_seen_at TEXT,
  last_seen_at TEXT,
  raw_json TEXT,
  PRIMARY KEY (site, id)
);

-- 列表按 category 与时间筛选、分页
CREATE INDEX IF NOT EXISTS idx_notices_category_publish
  ON notices (category_num, publish_time);

-- 按站点查询
CREATE INDEX IF NOT EXISTS idx_notices_site
  ON notices (site);
