import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { CrawlRun, ReviewsData } from "../lib/types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";

type DashboardProps = {
  navigate: (path: string) => void;
};

export function DashboardPage({ navigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [latestRun, setLatestRun] = useState<CrawlRun | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [reviews, runs] = await Promise.all([
          apiRequest<ReviewsData>("/api/admin/reviews?status=pending&page=1&pageSize=1"),
          apiRequest<{ list: CrawlRun[] }>("/api/admin/crawl/runs?limit=1"),
        ]);
        setPendingCount(reviews.total);
        setLatestRun(runs.list[0] ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="grid two-col">
      <button className="card action-card" onClick={() => navigate("/reviews")}>
        <div className="card-label">待审核数量</div>
        <div className="metric">{pendingCount}</div>
        <div className="card-hint">点击进入企业审核列表</div>
      </button>
      <div className="card">
        <div className="card-label">最近一次采集运行</div>
        {latestRun ? (
          <div className="stack">
            <div className="metric status-text">{latestRun.status}</div>
            <div>{latestRun.actionKey}</div>
            <div className="muted">{latestRun.summary ?? "暂无摘要"}</div>
            <button className="secondary-button" onClick={() => navigate(`/runs/${latestRun.id}`)}>
              查看详情
            </button>
          </div>
        ) : (
          <EmptyState label="暂无运行记录" />
        )}
      </div>
    </div>
  );
}
