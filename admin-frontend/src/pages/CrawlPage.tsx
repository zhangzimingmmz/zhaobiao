import React, { useEffect, useMemo, useState } from "react";
import { Form, Select, Input, Button, Card, message } from "antd";
import { apiRequest } from "../lib/api";
import type { CrawlAction, CrawlRun } from "../lib/types";
import { EmptyState, ErrorState, LoadingState } from "../components/States";
import { actionKeyLabel, crawlRunStatusLabel } from "../lib/statusLabels";

type ActionsResponse = { actions: CrawlAction[] };

export function CrawlPage({ navigate }: { navigate: (path: string) => void }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actions, setActions] = useState<CrawlAction[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [lastRun, setLastRun] = useState<CrawlRun | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await apiRequest<ActionsResponse>("/api/admin/crawl/actions");
        setActions(data.actions);
        form.setFieldValue("actionKey", data.actions[0]?.actionKey ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "加载失败");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const actionKey = Form.useWatch("actionKey", form);
  const needsDateRange = useMemo(
    () => (actionKey ?? "").includes("backfill") || (actionKey ?? "").includes("reconcile"),
    [actionKey],
  );

  async function handleSubmit(values: Record<string, unknown>) {
    if (!values.actionKey) return;
    setSubmitting(true);
    try {
      const params: Record<string, string> = {};
      if (needsDateRange) {
        if (values.start) params.start = String(values.start);
        if (values.end) params.end = String(values.end);
      }
      if (values.actionKey === "site1.backfill" && values.category) {
        params.category = String(values.category).trim();
      }
      if (values.actionKey === "site2.backfill" && values.noticeType) {
        params.noticeType = String(values.noticeType).trim();
      }
      const run = await apiRequest<CrawlRun>("/api/admin/crawl/runs", {
        method: "POST",
        body: { actionKey: values.actionKey, params },
      });
      setLastRun(run);
      message.success("提交成功");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState />;
  if (error && actions.length === 0) return <ErrorState error={error} />;
  if (actions.length === 0) return <EmptyState label="暂无可执行动作" />;

  return (
    <div className="grid two-col">
      <Card title="提交采集">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ actionKey: actions[0]?.actionKey ?? "" }}
        >
          <Form.Item name="actionKey" label="动作" rules={[{ required: true }]}>
            <Select
              options={actions.map((a) => ({ label: actionKeyLabel(a.actionKey), value: a.actionKey }))}
            />
          </Form.Item>
          {needsDateRange ? (
            <>
              <Form.Item name="start" label="开始日期">
                <Input type="date" />
              </Form.Item>
              <Form.Item name="end" label="结束日期">
                <Input type="date" />
              </Form.Item>
            </>
          ) : null}
          {actionKey === "site1.backfill" ? (
            <Form.Item name="category" label="category">
              <Input placeholder="可选" />
            </Form.Item>
          ) : null}
          {actionKey === "site2.backfill" ? (
            <Form.Item name="noticeType" label="noticeType">
              <Input placeholder="可选" />
            </Form.Item>
          ) : null}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {submitting ? "提交中..." : "提交运行"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Card title="最近提交结果">
        {lastRun ? (
          <>
            <div className="metric status-text">{crawlRunStatusLabel(lastRun.status)}</div>
            <div>{actionKeyLabel(lastRun.actionKey)}</div>
            <div className="muted">{lastRun.statusReason ?? lastRun.summary ?? "请求已提交"}</div>
            <Button type="link" onClick={() => navigate(`/runs/${lastRun.id}`)}>
              打开运行详情
            </Button>
          </>
        ) : (
          <EmptyState label="提交一次采集动作后，这里会显示结果" />
        )}
      </Card>
    </div>
  );
}
