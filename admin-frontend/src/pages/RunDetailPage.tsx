import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { CrawlRun } from "../lib/types";
import { ErrorState, LoadingState } from "../components/States";
import { crawlRunStatusLabel, siteLabel } from "../lib/statusLabels";

export function RunDetailPage({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [run, setRun] = useState<CrawlRun | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<CrawlRun>(`/api/admin/crawl/runs/${id}`);
        setRun(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!run) return null;

  return (
    <div className="stack">
      <div className="card detail-grid">
        <div><div className="detail-label">动作</div><div>{run.actionKey}</div></div>
        <div><div className="detail-label">状态</div><div>{crawlRunStatusLabel(run.status)}</div></div>
        <div><div className="detail-label">站点</div><div>{siteLabel(run.site)}</div></div>
        <div><div className="detail-label">请求时间</div><div>{run.requestedAt}</div></div>
        <div><div className="detail-label">执行摘要</div><div>{run.summary ?? "-"}</div></div>
        <div><div className="detail-label">失败原因</div><div>{run.statusReason ?? "-"}</div></div>
      </div>
      <div className="card stack">
        <div className="detail-label">请求参数</div>
        <pre>{JSON.stringify(run.requestPayload ?? {}, null, 2)}</pre>
      </div>
      <div className="card stack">
        <div className="detail-label">结果信息</div>
        <pre>{JSON.stringify(run.resultPayload ?? {}, null, 2)}</pre>
      </div>
    </div>
  );
}
