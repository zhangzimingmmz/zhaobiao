import React, { useRef } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType } from "@ant-design/pro-components";
import { Input, Modal, message } from "antd";
import { apiRequest, deleteTestCompanyData } from "../lib/api";
import { createEnterpriseColumns } from "./EnterpriseColumns";
import type { CompaniesData, ReviewItem, ReviewsData } from "../lib/types";
import { isSuperAdmin } from "../lib/auth";

type EnterpriseTableProps = {
  view: "applications" | "companies";
  navigate: (path: string) => void;
};

export function EnterpriseTable({ view, navigate }: EnterpriseTableProps) {
  const isApplications = view === "applications";
  const actionRef = useRef<ActionType>();

  function handleDelete(record: ReviewItem) {
    let confirmCreditCode = "";
    Modal.confirm({
      title: "删除企业数据",
      content: (
        <div style={{ display: "grid", gap: 12 }}>
          <div>该操作会删除该企业账号及其全部申请记录，删除后不可恢复。</div>
          <div>请输入该企业的统一社会信用代码完成确认。</div>
          <Input
            placeholder={record.creditCode || "请输入统一社会信用代码"}
            onChange={(event) => {
              confirmCreditCode = event.target.value;
            }}
          />
        </div>
      ),
      okText: "确认删除",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await deleteTestCompanyData(record.id, confirmCreditCode);
          message.success("企业数据已删除");
          await actionRef.current?.reload();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "删除失败";
          message.error(msg);
          throw err;
        }
      },
    });
  }

  const columns = createEnterpriseColumns({
    showActions: true,
    timeMode: isApplications ? "created" : "audit",
    onDelete: isApplications ? undefined : handleDelete,
    canDelete: () => !isApplications && isSuperAdmin(),
    onView: (record) =>
      navigate(
        isApplications
          ? `/enterprise/applications/${record.id}`
          : `/enterprise/companies/${record.id}`
      ),
  });

  return (
    <ProTable<ReviewItem>
      className={`enterprise-table enterprise-table--${view}`}
      actionRef={actionRef}
      columns={columns}
      request={async (params) => {
        const page = params.current ?? 1;
        const pageSize = params.pageSize ?? 20;
        const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
        const searchKeys = [
          "keyword",
          "status",
          "createdFrom",
          "createdTo",
          "auditFrom",
          "auditTo",
        ] as const;
        for (const key of searchKeys) {
          const value = params[key];
          if (typeof value === "string" && value.trim()) {
            query.set(key, value.trim());
          }
        }
        const path = isApplications ? "/api/admin/reviews" : "/api/admin/companies";
        const data = await apiRequest<ReviewsData | CompaniesData>(`${path}?${query.toString()}`);
        return { data: data.list, success: true, total: data.total };
      }}
      rowKey="id"
      search={{
        labelWidth: "auto",
        defaultCollapsed: false,
        span: 8,
        optionRender: (_, __, dom) => [<div key="actions" className="enterprise-search-actions">{dom}</div>],
      }}
      form={{ initialValues: { status: isApplications ? "" : undefined } }}
      pagination={{ defaultPageSize: 20, showSizeChanger: true }}
    />
  );
}
