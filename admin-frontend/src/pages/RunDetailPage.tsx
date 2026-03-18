import React, { useEffect, useState } from "react";
import { Card, Descriptions, Typography } from "antd";
import { apiRequest } from "../lib/api";
import type { CrawlRun } from "../lib/types";
import { ErrorState, LoadingState } from "../components/States";
import { actionKeyLabel, crawlRunStatusLabel, siteLabel } from "../lib/statusLabels";

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
      <Card title="运行信息">
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="动作">{actionKeyLabel(run.actionKey)}</Descriptions.Item>
          <Descriptions.Item label="状态">{crawlRunStatusLabel(run.status)}</Descriptions.Item>
          <Descriptions.Item label="站点">{siteLabel(run.site)}</Descriptions.Item>
          <Descriptions.Item label="请求时间">{run.requestedAt}</Descriptions.Item>
          <Descriptions.Item label="执行摘要">{run.summary ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="失败原因">{run.statusReason ?? "-"}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card title="请求参数">
        <Typography.Paragraph>
          <pre style={{ margin: 0, fontSize: 12 }}>
            {JSON.stringify(run.requestPayload ?? {}, null, 2)}
          </pre>
        </Typography.Paragraph>
      </Card>
      <Card title="结果信息">
        <Typography.Paragraph>
          <pre style={{ margin: 0, fontSize: 12 }}>
            {JSON.stringify(run.resultPayload ?? {}, null, 2)}
          </pre>
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
