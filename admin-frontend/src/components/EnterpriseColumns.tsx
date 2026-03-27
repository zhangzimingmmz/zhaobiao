import React from "react";
import type { ProColumns } from "@ant-design/pro-components";
import { Button } from "antd";
import type { ReviewItem } from "../lib/types";
import { reviewStatusLabel, reviewStatusBadgeClass } from "../lib/statusLabels";

export interface EnterpriseColumnsOptions {
  showActions?: boolean;
  onView?: (record: ReviewItem) => void;
  onDelete?: (record: ReviewItem) => void;
  canDelete?: (record: ReviewItem) => boolean;
  timeMode?: "created" | "audit";
}

export const createEnterpriseColumns = (
  options: EnterpriseColumnsOptions = {}
): ProColumns<ReviewItem>[] => {
  const { showActions = false, onView, onDelete, canDelete, timeMode = "audit" } = options;

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
        "": { text: "全部" },
        pending: { text: "待审核" },
        approved: { text: "已通过" },
        rejected: { text: "已驳回" },
        invalidated: { text: "已作废" },
      },
      render: (_, r) => (
        <span className={reviewStatusBadgeClass(r.status)}>{reviewStatusLabel(r.status)}</span>
      ),
    },
    {
      title: "审核人",
      dataIndex: "auditedByName",
      key: "auditedByName",
      render: (_, r) => r.auditedByName || r.auditedBy || "-",
    },
  ];

  if (timeMode === "created") {
    columns.push({
      title: "提交时间",
      dataIndex: "createdAt",
      key: "createdAt",
    });
  }

  if (timeMode === "audit") {
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
      render: (_, r) => {
        const items = [
          <Button key="view" type="link" size="small" onClick={() => onView(r)}>
            查看
          </Button>,
        ];
        if (onDelete && (!canDelete || canDelete(r))) {
          items.push(
            <Button key="delete" type="link" danger size="small" onClick={() => onDelete(r)}>
              删除
            </Button>
          );
        }
        return items;
      },
    });
  }

  return columns;
};
