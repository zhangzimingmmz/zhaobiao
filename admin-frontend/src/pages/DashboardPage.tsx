import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import type { CrawlRun, ReviewsData } from "../lib/types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import {
  actionKeyLabel,
  crawlRunDisplayStatus,
  crawlRunStatusLabel,
  runResultLabel,
  runStatusBadgeClass,
} from "../lib/statusLabels";

const BEIJING = "Asia/Shanghai";

function toBeijingDateStr(iso: string): string {
  return new Date(iso).toLocaleDateString("zh-CN", { timeZone: BEIJING }).replace(/\//g, "-");
}

function toBeijingTimeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString("zh-CN", {
    timeZone: BEIJING,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type DashboardProps = {
  navigate: (path: string) => void;
};

export function DashboardPage({ navigate }: DashboardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [latestRun, setLatestRun] = useState<CrawlRun | null>(null);
  const [runs, setRuns] = useState<CrawlRun[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [reviews, runsRes] = await Promise.all([
          apiRequest<ReviewsData>("/api/admin/reviews?status=pending&page=1&pageSize=1"),
          apiRequest<{ list: CrawlRun[] }>("/api/admin/crawl/runs?limit=50"),
        ]);
        setPendingCount(reviews.total);
        setLatestRun(runsRes.list[0] ?? null);
        setRuns(runsRes.list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const todayStr = useMemo(
    () => new Date().toLocaleDateString("zh-CN", { timeZone: BEIJING }).replace(/\//g, "-"),
    [],
  );
  const todayRuns = useMemo(
    () =>
      runs
        .filter((r) => toBeijingDateStr(r.requestedAt) === todayStr)
        .sort(
          (a, b) =>
            new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
        ),
    [runs, todayStr],
  );

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="stack">
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
              <div className="metric status-text">{crawlRunStatusLabel(latestRun.status)}</div>
              <div>{actionKeyLabel(latestRun.actionKey)}</div>
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

      <div className="card">
        <div className="card-header-row">
          <div className="card-label">今日定时任务概览</div>
          <button className="secondary-button" onClick={() => navigate("/runs")}>
            查看全部运行记录
          </button>
        </div>
        {todayRuns.length === 0 ? (
          <EmptyState label={`今日（${todayStr}）暂无运行记录`} />
        ) : (
          <div className="table-wrapper">
            <table className="runs-table">
              <thead>
                <tr>
                  <th>时间（北京）</th>
                  <th>任务</th>
                  <th>状态</th>
                  <th>结果</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {todayRuns.map((item) => (
                  <tr key={item.id}>
                    <td>{toBeijingTimeStr(item.requestedAt)}</td>
                    <td className="col-action">{actionKeyLabel(item.actionKey)}</td>
                    <td><span className={runStatusBadgeClass(item)}>{crawlRunDisplayStatus(item)}</span></td>
                    <td>{runResultLabel(item)}</td>
                    <td>
                      <button className="link-button" onClick={() => navigate(`/runs/${item.id}`)}>
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
