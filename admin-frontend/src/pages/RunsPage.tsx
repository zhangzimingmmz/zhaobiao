import React, { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import type { CrawlRun } from "../lib/types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import {
  actionKeyLabel,
  crawlRunDisplayStatus,
  runResultLabel,
  runStatusBadgeClass,
  siteLabel,
} from "../lib/statusLabels";

export function RunsPage({ navigate }: { navigate: (path: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [site, setSite] = useState("");
  const [items, setItems] = useState<CrawlRun[]>([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ limit: "50" });
        if (status) params.set("status", status);
        if (site) params.set("site", site);
        const data = await apiRequest<{ list: CrawlRun[] }>(`/api/admin/crawl/runs?${params.toString()}`);
        setItems(data.list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [status, site]);

  function formatTime(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return "-";
    }
  }

  return (
    <div className="runs-page">
      <div className="card filter-bar">
        <div className="toolbar">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            <option value="queued">排队中</option>
            <option value="running">运行中</option>
            <option value="succeeded">成功</option>
            <option value="failed">失败</option>
            <option value="rejected">已拒绝</option>
          </select>
          <select value={site} onChange={(e) => setSite(e.target.value)}>
            <option value="">全部站点</option>
            <option value="site1">站点一</option>
            <option value="site2">站点二</option>
          </select>
        </div>
      </div>
      {loading ? <LoadingState /> : null}
      {error ? <ErrorState error={error} /> : null}
      {!loading && !error && items.length === 0 ? <EmptyState /> : null}
      {!loading && !error && items.length > 0 ? (
        <div className="table-card">
          <table className="runs-table">
            <thead>
              <tr>
                <th>动作</th>
                <th>站点</th>
                <th>状态</th>
                <th>结果</th>
                <th>运行时间</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="col-action">{actionKeyLabel(item.actionKey)}</td>
                  <td className="col-site">{siteLabel(item.site)}</td>
                  <td className="col-status">
                    <span className={runStatusBadgeClass(item)}>{crawlRunDisplayStatus(item)}</span>
                  </td>
                  <td className={(item.errorCount ?? 0) > 0 ? "col-result col-result-fail" : "col-result"}>
                    {runResultLabel(item)}
                  </td>
                  <td className="col-time">{formatTime(item.requestedAt)}</td>
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
      ) : null}
    </div>
  );
}
