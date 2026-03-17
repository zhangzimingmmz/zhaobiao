import React from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { Button } from "antd";
import { apiRequest } from "../lib/api";
import type { ReviewItem, ReviewsData } from "../lib/types";
import { reviewStatusLabel } from "../lib/statusLabels";
import { createEnterpriseColumns } from "../components/EnterpriseColumns";

export function ReviewsPage({ navigate }: { navigate: (path: string) => void }) {
  const columns = createEnterpriseColumns({
    showActions: true,
    showCreatedAt: true,
    showAuditAt: false,
    onView: (r) => navigate(`/reviews/${r.id}`),
  });

  return (
    <ProTable<ReviewItem>
      columns={columns}
      request={async (params) => {
        const status = params.status ?? "pending";
        const page = params.current ?? 1;
        const pageSize = params.pageSize ?? 20;
        const data = await apiRequest<ReviewsData>(
          `/api/admin/reviews?status=${encodeURIComponent(status)}&page=${page}&pageSize=${pageSize}`,
        );
        return { data: data.list, success: true, total: data.total };
      }}
      rowKey="id"
      search={{
        labelWidth: "auto",
        defaultCollapsed: false,
      }}
      form={{
        initialValues: { status: "pending" },
      }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
    />
  );
}
