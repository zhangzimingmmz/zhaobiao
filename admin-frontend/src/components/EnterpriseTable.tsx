import React from "react";
import { ProTable } from "@ant-design/pro-components";
import { apiRequest } from "../lib/api";
import { createEnterpriseColumns } from "./EnterpriseColumns";
import type { CompaniesData, ReviewItem, ReviewsData } from "../lib/types";

type EnterpriseTableProps = {
  view: "applications" | "companies";
  navigate: (path: string) => void;
};

export function EnterpriseTable({ view, navigate }: EnterpriseTableProps) {
  const isApplications = view === "applications";
  const columns = createEnterpriseColumns({
    showActions: true,
    timeMode: isApplications ? "created" : "audit",
    onView: (record) =>
      navigate(
        isApplications
          ? `/enterprise/applications/${record.id}`
          : `/enterprise/companies/${record.id}`
      ),
  });

  return (
    <ProTable<ReviewItem>
      columns={columns}
      request={async (params) => {
        const status = params.status;
        const page = params.current ?? 1;
        const pageSize = params.pageSize ?? 20;
        const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        if (status) query.set("status", String(status));
        const path = isApplications ? "/api/admin/reviews" : "/api/admin/companies";
        const data = await apiRequest<ReviewsData | CompaniesData>(`${path}?${query.toString()}`);
        return { data: data.list, success: true, total: data.total };
      }}
      rowKey="id"
      search={{ labelWidth: "auto", defaultCollapsed: false }}
      form={{ initialValues: { status: isApplications ? "" : undefined } }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
    />
  );
}
