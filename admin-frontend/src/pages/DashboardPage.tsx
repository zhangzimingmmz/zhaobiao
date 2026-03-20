import React, { useEffect, useMemo, useState } from "react";
import { Card, Table, Button } from "antd";
import { apiRequest } from "../lib/api";
import type { CrawlRun, ReviewsData } from "../lib/types";
import { ApiUnavailableState, EmptyState, ErrorState, LoadingState } from "../components/States";
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

  const todayColumns = [
    { title: "时间（北京）", dataIndex: "requestedAt", key: "time", render: (_: unknown, r: CrawlRun) => toBeijingTimeStr(r.requestedAt) },
    { title: "任务", dataIndex: "actionKey", key: "action", render: (_: unknown, r: CrawlRun) => actionKeyLabel(r.actionKey) },
    {
      title: "状态",
      key: "status",
      render: (_: unknown, r: CrawlRun) => (
        <span className={runStatusBadgeClass(r)}>{crawlRunDisplayStatus(r)}</span>
      ),
    },
    { title: "结果", key: "result", render: (_: unknown, r: CrawlRun) => runResultLabel(r) },
    {
      title: "",
      key: "actions",
      render: (_: unknown, r: CrawlRun) => (
        <Button type="link" size="small" onClick={() => navigate(`/runs/${r.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="stack">
      <div className="grid two-col">
        <Card hoverable onClick={() => navigate("/reviews")} style={{ cursor: "pointer" }}>
          <div className="card-label">待审核数量</div>
          <div className="metric">{pendingCount}</div>
          <div className="card-hint">点击进入企业审核列表</div>
        </Card>
        <Card title="最近一次采集运行">
          {latestRun ? (
            <div className="stack">
              <div className="metric status-text">{crawlRunStatusLabel(latestRun.status)}</div>
              <div>{actionKeyLabel(latestRun.actionKey)}</div>
              <div className="muted">{latestRun.summary ?? "暂无摘要"}</div>
              <Button type="link" onClick={() => navigate(`/runs/${latestRun.id}`)}>
                查看详情
              </Button>
            </div>
          ) : (
            <EmptyState label="暂无运行记录" />
          )}
        </Card>
      </div>

      <Card title="快捷入口">
        <div className="button-row">
          <Button type="primary" onClick={() => navigate("/reviews")}>
            进入企业审核
          </Button>
          <Button onClick={() => navigate("/crawl")}>进入采集控制</Button>
          <Button onClick={() => navigate("/companies")}>进入企业目录</Button>
          <Button onClick={() => navigate("/runs")}>查看运行记录</Button>
        </div>
      </Card>

      <Card title="待补健康指标">
        <ApiUnavailableState label="失败告警聚合、数据新鲜度细分卡片、跨模块异常提醒仍待独立接口支持，当前先保留总览结构位。" />
      </Card>

      <Card
        title={`今日定时任务概览（${todayStr}）`}
        extra={
          <Button type="link" onClick={() => navigate("/runs")}>
            查看全部运行记录
          </Button>
        }
      >
        {todayRuns.length === 0 ? (
          <EmptyState label={`今日（${todayStr}）暂无运行记录`} />
        ) : (
          <Table
            dataSource={todayRuns}
            columns={todayColumns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        )}
      </Card>
    </div>
  );
}
