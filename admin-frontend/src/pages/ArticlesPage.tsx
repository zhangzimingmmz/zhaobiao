import React, { useRef } from "react";
import { ProTable } from "@ant-design/pro-components";
import type { ActionType } from "@ant-design/pro-components";
import type { ProColumns } from "@ant-design/pro-components";
import { Button, Modal, message, Tag } from "antd";
import {
  getAdminArticles,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  type Article,
} from "../lib/api";

const OFFICIAL_ACCOUNT_PUBLISH_URL = "https://mp.weixin.qq.com/";

const CATEGORY_LABELS: Record<string, string> = {
  company_news: "工作动态",
  policy: "政策法规",
  announcement: "其他",
  other: "其他",
};

type ArticlesPageProps = {
  navigate: (path: string) => void;
};

export function ArticlesPage({ navigate }: ArticlesPageProps) {
  const actionRef = useRef<ActionType>(null);
  const categoryLabel = (c: string | null) => (c ? CATEGORY_LABELS[c] ?? c : "-");

  const reload = () => actionRef.current?.reload();

  const handlePublish = async (record: Article) => {
    Modal.confirm({
      title: "确认发布",
      content: "确认发布此文章？",
      onOk: async () => {
        try {
          await publishArticle(record.id);
          message.success("发布成功");
          reload();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "发布失败");
          throw err;
        }
      },
    });
  };

  const handleUnpublish = async (record: Article) => {
    Modal.confirm({
      title: "确认下线",
      content: "确认下线此文章？",
      onOk: async () => {
        try {
          await unpublishArticle(record.id);
          message.success("下线成功");
          reload();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "下线失败");
          throw err;
        }
      },
    });
  };

  const handleDelete = async (record: Article) => {
    Modal.confirm({
      title: "确认删除",
      content: "确认删除此文章？此操作不可恢复。",
      okText: "删除",
      okType: "danger",
      onOk: async () => {
        try {
          await deleteArticle(record.id);
          message.success("删除成功");
          reload();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "删除失败");
          throw err;
        }
      },
    });
  };

  const columns: ProColumns<Article>[] = [
    {
      title: "关键词",
      dataIndex: "keyword",
      key: "keyword",
      hideInTable: true,
      fieldProps: { placeholder: "搜索标题或摘要" },
    },
    { title: "标题", dataIndex: "title", key: "title", ellipsis: true, hideInSearch: true },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      valueType: "select",
      valueEnum: {
        "": { text: "全部分类" },
        company_news: { text: "工作动态" },
        policy: { text: "政策法规" },
        announcement: { text: "其他" },
        other: { text: "其他" },
      },
      render: (_, r) => categoryLabel(r.category),
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      valueType: "select",
      valueEnum: {
        "": { text: "全部状态" },
        draft: { text: "草稿" },
        published: { text: "已发布" },
      },
      render: (_, r) => (
        <Tag color={r.status === "published" ? "green" : "default"}>
          {r.status === "published" ? "已发布" : "草稿"}
        </Tag>
      ),
    },
    {
      title: "发布时间",
      dataIndex: "publishTime",
      key: "publishTime",
      render: (_, r) =>
        r.publishTime ? new Date(r.publishTime).toLocaleString() : "-",
    },
    { title: "浏览量", dataIndex: "viewCount", key: "viewCount", width: 90 },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_, record) => (
        <div className="article-actions">
          <Button type="link" size="small" onClick={() => navigate(`/articles/edit/${record.id}`)}>
            编辑
          </Button>
          {record.status === "draft" && (
            <Button type="link" size="small" onClick={() => handlePublish(record)}>
              发布
            </Button>
          )}
          {record.status === "published" && (
            <Button type="link" size="small" onClick={() => handleUnpublish(record)}>
              下线
            </Button>
          )}
          <Button type="link" size="small" danger onClick={() => handleDelete(record)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ProTable<Article>
      actionRef={actionRef}
      columns={columns}
      rowKey="id"
      request={async (params) => {
        const data = await getAdminArticles({
          status: params.status || undefined,
          category: params.category || undefined,
          keyword: params.keyword || undefined,
          page: params.current ?? 1,
          pageSize: params.pageSize ?? 10,
        });
        return { data: data.list, success: true, total: data.total };
      }}
      search={{
        labelWidth: "auto",
        defaultCollapsed: false,
      }}
      form={{
        initialValues: { status: "", category: "", keyword: "" },
      }}
      pagination={{ defaultPageSize: 10, showSizeChanger: true }}
      scroll={{ x: 920 }}
      toolBarRender={() => [
        <Button key="new" type="primary" onClick={() => navigate("/articles/new")}>
          新增信息展示
        </Button>,
        <Button
          key="wechat-publish"
          onClick={() => window.open(OFFICIAL_ACCOUNT_PUBLISH_URL, "_blank", "noopener,noreferrer")}
        >
          公众号信息发布右→
        </Button>,
      ]}
    />
  );
}
