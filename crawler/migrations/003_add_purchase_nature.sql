-- 项目分类列，用于 site2 采购公告（1=货物、2=工程、3=服务）
-- 若列已存在则忽略（SQLite 无 ADD COLUMN IF NOT EXISTS，由 ensure_schema 捕获）
ALTER TABLE notices ADD COLUMN purchase_nature TEXT;
