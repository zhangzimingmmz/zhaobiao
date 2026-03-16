import React, { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../lib/api";
import type { CrawlAction, CrawlRun } from "../lib/types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { actionKeyLabel, crawlRunStatusLabel } from "../lib/statusLabels";

type ActionsResponse = { actions: CrawlAction[] };

export function CrawlPage({ navigate }: { navigate: (path: string) => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actions, setActions] = useState<CrawlAction[]>([]);
  const [actionKey, setActionKey] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [category, setCategory] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastRun, setLastRun] = useState<CrawlRun | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<ActionsResponse>("/api/admin/crawl/actions");
        setActions(data.actions);
        setActionKey(data.actions[0]?.actionKey ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const needsDateRange = useMemo(
    () => actionKey.includes("backfill") || actionKey.includes("reconcile"),
    [actionKey],
  );

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (needsDateRange) {
        params.start = start;
        params.end = end;
      }
      if (actionKey === "site1.backfill" && category.trim()) {
        params.category = category.trim();
      }
      if (actionKey === "site2.backfill" && noticeType.trim()) {
        params.noticeType = noticeType.trim();
      }
      const run = await apiRequest<CrawlRun>("/api/admin/crawl/runs", {
        method: "POST",
        body: { actionKey, params },
      });
      setLastRun(run);
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && actions.length === 0) return <ErrorState error={error} />;
  if (actions.length === 0) return <EmptyState label="暂无可执行动作" />;

  return (
    <div className="grid two-col">
      <div className="card stack">
        <label>
          动作
          <select value={actionKey} onChange={(e) => setActionKey(e.target.value)}>
            {actions.map((action) => (
              <option key={action.actionKey} value={action.actionKey}>
                {actionKeyLabel(action.actionKey)}
              </option>
            ))}
          </select>
        </label>
        {needsDateRange ? (
          <>
            <label>
              开始日期
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </label>
            <label>
              结束日期
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </label>
          </>
        ) : null}
        {actionKey === "site1.backfill" ? (
          <label>
            category
            <input value={category} onChange={(e) => setCategory(e.target.value)} />
          </label>
        ) : null}
        {actionKey === "site2.backfill" ? (
          <label>
            noticeType
            <input value={noticeType} onChange={(e) => setNoticeType(e.target.value)} />
          </label>
        ) : null}
        {error ? <div className="inline-error">{error}</div> : null}
        <button className="primary-button" disabled={submitting} onClick={() => void submit()}>
          {submitting ? "提交中..." : "提交运行"}
        </button>
      </div>
      <div className="card stack">
        <div className="card-label">最近提交结果</div>
        {lastRun ? (
          <>
            <div className="metric status-text">{crawlRunStatusLabel(lastRun.status)}</div>
            <div>{actionKeyLabel(lastRun.actionKey)}</div>
            <div className="muted">{lastRun.statusReason ?? lastRun.summary ?? "请求已提交"}</div>
            <button className="secondary-button" onClick={() => navigate(`/runs/${lastRun.id}`)}>
              打开运行详情
            </button>
          </>
        ) : (
          <EmptyState label="提交一次采集动作后，这里会显示结果" />
        )}
      </div>
    </div>
  );
}
