-- ============================================================
-- 文章表 (articles)
-- 用途: 存储运营人工编辑的图文信息元数据
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
    -- 主键
    id                  TEXT PRIMARY KEY,
    
    -- 基本信息
    title               TEXT NOT NULL,
    summary             TEXT,
    cover_image_url     TEXT,
    
    -- 内容
    wechat_article_url  TEXT NOT NULL,
    
    -- 分类与状态
    category            TEXT,
    status              TEXT NOT NULL DEFAULT 'draft',
    
    -- 排序与权重
    sort_order          INTEGER DEFAULT 0,
    
    -- 时间戳
    publish_time        TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL,
    
    -- 审计字段
    author_id           TEXT,
    author_name         TEXT,
    
    -- 链接状态 (用于监控)
    link_status         TEXT DEFAULT 'active',
    
    -- 浏览统计
    view_count          INTEGER DEFAULT 0
);

-- ============================================================
-- 文章操作日志表 (article_operation_logs)
-- 用途: 记录文章的所有操作历史
-- ============================================================
CREATE TABLE IF NOT EXISTS article_operation_logs (
    id              TEXT PRIMARY KEY,
    article_id      TEXT NOT NULL,
    operation       TEXT NOT NULL,
    operator_id     TEXT NOT NULL,
    operator_name   TEXT,
    old_data        TEXT,
    new_data        TEXT,
    created_at      TEXT NOT NULL,
    
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

-- ============================================================
-- 索引设计
-- ============================================================

-- 小程序查询已发布文章 (按发布时间倒序)
CREATE INDEX IF NOT EXISTS idx_articles_status_publish 
    ON articles(status, publish_time DESC);

-- 按分类筛选
CREATE INDEX IF NOT EXISTS idx_articles_category 
    ON articles(category);

-- 后台管理列表排序
CREATE INDEX IF NOT EXISTS idx_articles_created 
    ON articles(created_at DESC);

-- 公众号链接唯一约束 (防止重复)
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_wechat_url 
    ON articles(wechat_article_url);

-- 操作日志查询
CREATE INDEX IF NOT EXISTS idx_article_logs_article 
    ON article_operation_logs(article_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_logs_operator 
    ON article_operation_logs(operator_id, created_at DESC);
