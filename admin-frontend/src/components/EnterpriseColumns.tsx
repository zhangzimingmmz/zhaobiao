import React from "react";
import type { ProColumns } from "@ant-design/pro-components";
import { Button } from "antd";
import type { Dayjs } from "dayjs";
import type { ReviewItem } from "../lib/types";
import { reviewStatusLabel, reviewStatusBadgeClass } from "../lib/statusLabels";

const BEIJING = "Asia/Shanghai";

function formatListTime(iso?: string | null): string {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date
    .toLocaleString("zh-CN", {
      timeZone: BEIJING,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .replace(/\//g, "-");
}

export interface EnterpriseColumnsOptions {
  showActions?: boolean;
  onView?: (record: ReviewItem) => void;
  onDelete?: (record: ReviewItem) => void;
  canDelete?: (record: ReviewItem) => boolean;
  timeMode?: "created" | "audit";
}

function transformDateRange(
  value?: Dayjs[]
): Record<string, string> | undefined {
  if (!value || value.length !== 2 || !value[0] || !value[1]) {
    return undefined;
  }
  return {
    from: value[0].format("YYYY-MM-DD"),
    to: value[1].format("YYYY-MM-DD"),
  };
}

export const createEnterpriseColumns = (
  options: EnterpriseColumnsOptions = {}
): ProColumns<ReviewItem>[] => {
  const { showActions = false, onView, onDelete, canDelete, timeMode = "audit" } = options;

  const columns: ProColumns<ReviewItem>[] = [
    {
      title: "关键词",
      dataIndex: "keyword",
      key: "keyword",
      hideInTable: true,
      order: 100,
      fieldProps: {
        placeholder: "登录名/手机号/身份证/信用代码/法人",
      },
      search: {
        transform: (value) => ({ keyword: value }),
      },
    },
    {
      title: "登录名",
      dataIndex: "username",
      key: "username",
      hideInSearch: true,
      width: 140,
      render: (v) => v || "-",
    },
    {
      title: "注册手机号",
      dataIndex: "userMobile",
      key: "userMobile",
      hideInSearch: true,
      width: 140,
      render: (v) => v || "-",
    },
    {
      title: "身份证号",
      dataIndex: "idCardMasked",
      key: "idCardMasked",
      hideInSearch: true,
      width: 170,
      render: (v) => v || "-",
    },
    {
      title: "统一社会信用代码",
      dataIndex: "creditCode",
      key: "creditCode",
      hideInSearch: true,
      width: 180,
      render: (v) => v || "-",
    },
    {
      title: "法人姓名",
      dataIndex: "legalPersonName",
      key: "legalPersonName",
      hideInSearch: true,
      width: 140,
      render: (v) => v || "-",
    },
    {
      title: "法人手机号",
      dataIndex: "legalPersonPhone",
      key: "legalPersonPhone",
      hideInSearch: true,
      width: 140,
      render: (v) => v || "-",
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
      order: 90,
      render: (_, r) => (
        <span className={reviewStatusBadgeClass(r.status)}>{reviewStatusLabel(r.status)}</span>
      ),
    },
    {
      title: "审核人",
      dataIndex: "auditedByName",
      key: "auditedByName",
      hideInSearch: true,
      width: 120,
      render: (_, r) => r.auditedByName || r.auditedBy || "-",
    },
  ];

  if (timeMode === "created") {
    columns.push({
      title: "提交时间",
      dataIndex: "createdDateRange",
      key: "createdDateRange",
      valueType: "dateRange",
      hideInTable: true,
      order: 80,
      fieldProps: {
        placeholder: ["开始日期", "结束日期"],
      },
      search: {
        transform: (value) => {
          const range = transformDateRange(value as Dayjs[]);
          if (!range) return {};
          return { createdFrom: range.from, createdTo: range.to };
        },
      },
    });
    columns.push({
      title: "提交时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      hideInSearch: true,
      render: (v) => formatListTime(typeof v === "string" ? v : v == null ? null : String(v)),
    });
  }

  if (timeMode === "audit") {
    columns.push({
      title: "审核时间",
      dataIndex: "auditDateRange",
      key: "auditDateRange",
      valueType: "dateRange",
      hideInTable: true,
      order: 80,
      fieldProps: {
        placeholder: ["开始日期", "结束日期"],
      },
      search: {
        transform: (value) => {
          const range = transformDateRange(value as Dayjs[]);
          if (!range) return {};
          return { auditFrom: range.from, auditTo: range.to };
        },
      },
    });
    columns.push({
      title: "审核时间",
      dataIndex: "auditAt",
      key: "auditAt",
      width: 160,
      hideInSearch: true,
      render: (v) => formatListTime(typeof v === "string" ? v : v == null ? null : String(v)),
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
