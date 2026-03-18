import React from "react";
import type { ProColumns } from "@ant-design/pro-components";
import { Button } from "antd";
import type { ReviewItem } from "../lib/types";
import { reviewStatusLabel } from "../lib/statusLabels";

export interface EnterpriseColumnsOptions {
  showActions?: boolean;
  onView?: (record: ReviewItem) => void;
  showCreatedAt?: boolean;
  showAuditAt?: boolean;
}

export const createEnterpriseColumns = (
  options: EnterpriseColumnsOptions = {}
): ProColumns<ReviewItem>[] => {
  const { showActions = false, onView, showCreatedAt = false, showAuditAt = true } = options;

  const columns: ProColumns<ReviewItem>[] = [
    {
      title: "企业名称 / 登录名",
      dataIndex: "companyName",
      key: "company",
      render: (_, r) => (
        <span>
          {r.companyName}
          <br />
          <span style={{ color: "#8c8c8c", fontSize: 12 }}>{r.username}</span>
        </span>
      ),
    },
    {
      title: "统一社会信用代码",
      dataIndex: "creditCode",
      key: "creditCode",
      width: 180,
      render: (v) => v || "-",
    },
    {
      title: "法人 / 联系人",
      dataIndex: "legalPersonName",
      key: "contact",
      render: (_, r) => {
        const legal = r.legalPersonName || r.contactName;
        const phone = r.legalPersonPhone || r.contactPhone;
        return (
          <span>
            {legal || "-"}
            <br />
            <span style={{ color: "#8c8c8c", fontSize: 12 }}>{phone || "-"}</span>
          </span>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      valueType: "select",
      valueEnum: {
        pending: { text: "待审核" },
        approved: { text: "已通过" },
        rejected: { text: "已驳回" },
      },
      render: (_, r) => reviewStatusLabel(r.status),
    },
  ];

  if (showCreatedAt) {
    columns.push({
      title: "提交时间",
      dataIndex: "createdAt",
      key: "createdAt",
    });
  }

  if (showAuditAt) {
    columns.push({
      title: "审核时间",
      dataIndex: "auditAt",
      key: "auditAt",
      render: (v) => v ?? "-",
    });
  }

  if (showActions && onView) {
    columns.push({
      title: "操作",
      key: "action",
      valueType: "option",
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => onView(r)}>
          查看
        </Button>
      ),
    });
  }

  return columns;
};
