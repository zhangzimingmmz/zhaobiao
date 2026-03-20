import React from "react";
import { ProTable } from "@ant-design/pro-components";
import { apiRequest } from "../lib/api";
import type { ReviewItem, CompaniesData } from "../lib/types";
import { createEnterpriseColumns } from "../components/EnterpriseColumns";

export function CompaniesPage({ navigate }: { navigate: (path: string) => void }) {
  const columns = createEnterpriseColumns({
    showActions: true,
    showCreatedAt: false,
    showAuditAt: true,
    onView: (r) => navigate(`/companies/${r.id}`),
  });

  return (
    <ProTable<ReviewItem>
      columns={columns}
      request={async (params) => {
        const page = params.current ?? 1;
        const pageSize = params.pageSize ?? 20;
        const status = params.status;
        
        let url = `/api/admin/companies?page=${page}&pageSize=${pageSize}`;
        if (status) {
          url += `&status=${encodeURIComponent(status)}`;
        }
        
        const data = await apiRequest<CompaniesData>(url);
        return { data: data.list, success: true, total: data.total };
      }}
      rowKey="id"
      search={{
        labelWidth: "auto",
        defaultCollapsed: false,
      }}
      form={{
        initialValues: { status: undefined },
      }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
    />
  );
}
