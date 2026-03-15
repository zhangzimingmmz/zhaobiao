CREATE TABLE IF NOT EXISTS crawl_runs (
    id TEXT PRIMARY KEY,
    site TEXT NOT NULL,
    task_name TEXT NOT NULL,
    action_key TEXT NOT NULL,
    run_kind TEXT NOT NULL,
    trigger_source TEXT NOT NULL,
    requested_by TEXT,
    status TEXT NOT NULL,
    status_reason TEXT,
    request_payload TEXT,
    result_payload TEXT,
    summary TEXT,
    requested_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT,
    log_path TEXT,
    command TEXT,
    exit_code INTEGER,
    fetched_count INTEGER,
    upserted_count INTEGER,
    error_count INTEGER
);

CREATE INDEX IF NOT EXISTS idx_crawl_runs_requested_at
ON crawl_runs(requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_crawl_runs_status_requested_at
ON crawl_runs(status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_crawl_runs_site_requested_at
ON crawl_runs(site, requested_at DESC);

CREATE TABLE IF NOT EXISTS crawl_run_locks (
    site TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    acquired_at TEXT NOT NULL
);
