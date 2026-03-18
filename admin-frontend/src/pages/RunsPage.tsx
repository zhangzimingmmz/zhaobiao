import React, { useRef } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import type { ActionType } from "@ant-design/pro-components";
import { Button } from "antd";
import { apiRequest } from "../lib/api";
import type { CrawlRun } from "../lib/types";
import {
  actionKeyLabel,
  crawlRunDisplayStatus,
  runResultLabel,
  runStatusBadgeClass,
  siteLabel,
} from "../lib/statusLabels";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

export function RunsPage({ navigate }: { navigate: (path: string) => void }) {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<CrawlRun>[] = [
    {
      title: "动作",
      dataIndex: "actionKey",
      key: "actionKey",
      render: (_, r) => actionKeyLabel(r.actionKey),
    },
    {
      title: "站点",
      dataIndex: "site",
      key: "site",
      valueType: "select",
      valueEnum: {
        "": { text: "全部站点" },
        site1: { text: "站点一" },
        site2: { text: "站点二" },
      },
      render: (_, r) => siteLabel(r.site),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      valueType: "select",
      valueEnum: {
        "": { text: "全部状态" },
        queued: { text: "排队中" },
        running: { text: "运行中" },
        succeeded: { text: "成功" },
        failed: { text: "失败" },
        rejected: { text: "已拒绝" },
      },
      render: (_, r) => (
        <span className={runStatusBadgeClass(r)}>{crawlRunDisplayStatus(r)}</span>
      ),
    },
    {
      title: "结果",
      dataIndex: "summary",
      key: "result",
      render: (_, r) => (
        <span style={(r.errorCount ?? 0) > 0 ? { color: "#ff4d4f" } : undefined}>
          {runResultLabel(r)}
        </span>
      ),
    },
    {
      title: "运行时间",
      dataIndex: "requestedAt",
      key: "requestedAt",
      render: (_, r) => formatTime(r.requestedAt),
    },
    {
      title: "操作",
      key: "actions",
      width: 80,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => navigate(`/runs/${r.id}`)}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <ProTable<CrawlRun>
      actionRef={actionRef}
      columns={columns}
      rowKey="id"
      request={async (params) => {
        const qs = new URLSearchParams({ limit: "50" });
        if (params.status) qs.set("status", params.status);
        if (params.site) qs.set("site", params.site);
        const data = await apiRequest<{ list: CrawlRun[] }>(
          `/api/admin/crawl/runs?${qs.toString()}`,
        );
        return {
          data: data.list,
          success: true,
          total: data.list.length,
        };
      }}
      search={{
        labelWidth: "auto",
        defaultCollapsed: false,
      }}
      form={{
        initialValues: { status: "", site: "" },
      }}
      pagination={{ defaultPageSize: 50, showSizeChanger: false }}
    />
  );
}
